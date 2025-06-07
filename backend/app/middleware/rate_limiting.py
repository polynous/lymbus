import time
import redis
from typing import Dict, Optional
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
import json
import hashlib
from datetime import datetime, timedelta

class InMemoryRateLimiter:
    """In-memory rate limiter for development/testing"""
    
    def __init__(self):
        self.requests: Dict[str, list] = {}
        self.blocked_ips: Dict[str, float] = {}
    
    def is_allowed(self, key: str, limit: int, window: int) -> tuple[bool, dict]:
        """Check if request is allowed and return status info"""
        now = time.time()
        
        # Check if IP is temporarily blocked
        if key in self.blocked_ips:
            if now < self.blocked_ips[key]:
                remaining_time = int(self.blocked_ips[key] - now)
                return False, {
                    "allowed": False,
                    "limit": limit,
                    "remaining": 0,
                    "reset_time": int(self.blocked_ips[key]),
                    "retry_after": remaining_time,
                    "blocked": True
                }
            else:
                # Block expired, remove it
                del self.blocked_ips[key]
        
        # Initialize or clean old requests
        if key not in self.requests:
            self.requests[key] = []
        
        # Remove requests outside the window
        self.requests[key] = [req_time for req_time in self.requests[key] if now - req_time < window]
        
        # Check if limit exceeded
        if len(self.requests[key]) >= limit:
            # Block IP for 15 minutes if limit exceeded multiple times
            if len(self.requests[key]) >= limit * 2:
                self.blocked_ips[key] = now + 900  # 15 minutes
            
            reset_time = int(min(self.requests[key]) + window)
            return False, {
                "allowed": False,
                "limit": limit,
                "remaining": 0,
                "reset_time": reset_time,
                "retry_after": reset_time - int(now),
                "blocked": False
            }
        
        # Allow request
        self.requests[key].append(now)
        remaining = limit - len(self.requests[key])
        reset_time = int(now + window)
        
        return True, {
            "allowed": True,
            "limit": limit,
            "remaining": remaining,
            "reset_time": reset_time,
            "retry_after": 0,
            "blocked": False
        }

class RedisRateLimiter:
    """Redis-based rate limiter for production"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        try:
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            self.redis_client.ping()  # Test connection
            self.available = True
        except:
            self.available = False
            print("Redis not available, falling back to in-memory rate limiting")
    
    def is_allowed(self, key: str, limit: int, window: int) -> tuple[bool, dict]:
        """Check if request is allowed using Redis"""
        if not self.available:
            return True, {"allowed": True, "limit": limit, "remaining": limit}
        
        now = time.time()
        pipeline = self.redis_client.pipeline()
        
        # Check if IP is blocked
        blocked_key = f"blocked:{key}"
        if self.redis_client.get(blocked_key):
            ttl = self.redis_client.ttl(blocked_key)
            return False, {
                "allowed": False,
                "limit": limit,
                "remaining": 0,
                "reset_time": int(now + ttl),
                "retry_after": ttl,
                "blocked": True
            }
        
        # Sliding window counter
        requests_key = f"requests:{key}"
        
        # Remove old requests
        pipeline.zremrangebyscore(requests_key, "-inf", now - window)
        
        # Count current requests
        pipeline.zcard(requests_key)
        
        # Add current request
        pipeline.zadd(requests_key, {str(now): now})
        
        # Set expiry
        pipeline.expire(requests_key, window)
        
        results = pipeline.execute()
        current_requests = results[1]
        
        if current_requests >= limit:
            # Block IP if severely exceeding limit
            if current_requests >= limit * 2:
                self.redis_client.setex(blocked_key, 900, "1")  # 15 minutes
            
            # Calculate reset time
            earliest_request = self.redis_client.zrange(requests_key, 0, 0, withscores=True)
            reset_time = int(earliest_request[0][1] + window) if earliest_request else int(now + window)
            
            return False, {
                "allowed": False,
                "limit": limit,
                "remaining": 0,
                "reset_time": reset_time,
                "retry_after": reset_time - int(now),
                "blocked": False
            }
        
        return True, {
            "allowed": True,
            "limit": limit,
            "remaining": limit - current_requests,
            "reset_time": int(now + window),
            "retry_after": 0,
            "blocked": False
        }

class RateLimitMiddleware:
    """Rate limiting middleware for FastAPI"""
    
    def __init__(self, redis_url: Optional[str] = None):
        if redis_url:
            self.limiter = RedisRateLimiter(redis_url)
        else:
            self.limiter = InMemoryRateLimiter()
        
        # Rate limit configurations for different endpoints
        self.rate_limits = {
            # Authentication endpoints
            "auth_login": {"limit": 5, "window": 900},  # 5 attempts per 15 minutes
            "auth_general": {"limit": 20, "window": 60},  # 20 requests per minute
            
            # API endpoints
            "api_general": {"limit": 100, "window": 60},  # 100 requests per minute
            "api_strict": {"limit": 30, "window": 60},   # 30 requests per minute
            
            # Upload endpoints
            "upload": {"limit": 10, "window": 300},      # 10 uploads per 5 minutes
            
            # Password reset
            "password_reset": {"limit": 3, "window": 3600}, # 3 attempts per hour
        }
    
    def get_client_ip(self, request: Request) -> str:
        """Get client IP address with proxy support"""
        # Check for forwarded IPs (from reverse proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct client IP
        return request.client.host if request.client else "unknown"
    
    def get_rate_limit_key(self, request: Request, endpoint_type: str) -> str:
        """Generate rate limit key based on IP and endpoint"""
        client_ip = self.get_client_ip(request)
        return f"{endpoint_type}:{client_ip}"
    
    def determine_endpoint_type(self, request: Request) -> str:
        """Determine the rate limit type based on the request path"""
        path = request.url.path
        method = request.method
        
        # Authentication endpoints
        if path == "/api/auth/token":
            return "auth_login"
        elif path.startswith("/api/auth/"):
            return "auth_general"
        
        # Password reset
        elif "password" in path and "reset" in path:
            return "password_reset"
        
        # Upload endpoints
        elif method == "POST" and ("upload" in path or "file" in path):
            return "upload"
        
        # Strict API endpoints (sensitive operations)
        elif any(sensitive in path for sensitive in ["/admin/", "/users/", "/invitations/"]):
            return "api_strict"
        
        # General API endpoints
        elif path.startswith("/api/"):
            return "api_general"
        
        # Default to general API limits
        return "api_general"
    
    async def __call__(self, request: Request, call_next):
        """Rate limiting middleware handler"""
        # Skip rate limiting for health checks and static files
        if request.url.path in ["/health", "/", "/docs", "/openapi.json"]:
            return await call_next(request)
        
        endpoint_type = self.determine_endpoint_type(request)
        rate_config = self.rate_limits.get(endpoint_type, self.rate_limits["api_general"])
        
        key = self.get_rate_limit_key(request, endpoint_type)
        allowed, info = self.limiter.is_allowed(
            key, 
            rate_config["limit"], 
            rate_config["window"]
        )
        
        if not allowed:
            # Log rate limit violation
            client_ip = self.get_client_ip(request)
            print(f"Rate limit exceeded for IP {client_ip} on endpoint {request.url.path}")
            
            # Return rate limit error
            headers = {
                "X-RateLimit-Limit": str(info["limit"]),
                "X-RateLimit-Remaining": str(info["remaining"]),
                "X-RateLimit-Reset": str(info["reset_time"]),
                "Retry-After": str(info["retry_after"])
            }
            
            error_message = "Demasiadas solicitudes. Intenta de nuevo más tarde."
            if info.get("blocked"):
                error_message = "IP temporalmente bloqueada por exceso de solicitudes."
            
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": error_message,
                    "retry_after": info["retry_after"]
                },
                headers=headers
            )
        
        # Add rate limit headers to successful responses
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(info["limit"])
        response.headers["X-RateLimit-Remaining"] = str(info["remaining"])
        response.headers["X-RateLimit-Reset"] = str(info["reset_time"])
        
        return response

# Export the middleware
rate_limit_middleware = RateLimitMiddleware() 