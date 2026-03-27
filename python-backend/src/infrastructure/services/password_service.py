"""Password hashing service using scrypt.

Matches the TypeScript implementation's password hashing for compatibility.
Uses scrypt with 16-byte random salt, 64-byte key output.
"""

import hashlib
import hmac
import secrets


def hash_password(password: str) -> str:
    """Hash a password using scrypt.

    Matches the TypeScript implementation:
    - 16-byte random salt (32 hex chars)
    - scrypt with N=2^14, r=8, p=1, dklen=64
    - Format: {hash}.{salt}

    Args:
        password: Plain text password to hash

    Returns:
        Hashed password in format "hash.salt"
    """
    salt = secrets.token_hex(16)  # 16 bytes = 32 hex chars
    password_bytes = password.encode("utf-8")
    salt_bytes = salt.encode("utf-8")

    # scrypt parameters matching Node.js crypto.scrypt defaults
    # Node.js uses N=16384 (2^14), r=8, p=1
    hashed = hashlib.scrypt(
        password_bytes,
        salt=salt_bytes,
        n=16384,  # CPU/memory cost parameter (2^14)
        r=8,  # Block size
        p=1,  # Parallelization
        dklen=64,  # Output key length
    )

    return f"{hashed.hex()}.{salt}"


def verify_password(supplied: str, stored: str) -> bool:
    """Verify a password against a stored hash.

    Uses constant-time comparison to prevent timing attacks.

    Args:
        supplied: Plain text password to verify
        stored: Previously hashed password (format: hash.salt)

    Returns:
        True if password matches, False otherwise
    """
    try:
        hashed_hex, salt = stored.split(".")
    except ValueError:
        return False

    password_bytes = supplied.encode("utf-8")
    salt_bytes = salt.encode("utf-8")

    # Hash the supplied password with the same salt
    supplied_hash = hashlib.scrypt(
        password_bytes,
        salt=salt_bytes,
        n=16384,
        r=8,
        p=1,
        dklen=64,
    )

    stored_hash = bytes.fromhex(hashed_hex)

    # Constant-time comparison
    return hmac.compare_digest(supplied_hash, stored_hash)
