"""Unit tests for password service.

Tests password hashing and verification to ensure compatibility
with the TypeScript backend's scrypt implementation.
"""

import pytest

from src.infrastructure.services.password_service import hash_password, verify_password


class TestHashPassword:
    """Tests for hash_password function."""

    def test_returns_hash_and_salt_separated_by_dot(self) -> None:
        """Hash should be in format 'hash.salt'."""
        result = hash_password("testpassword")

        assert "." in result
        parts = result.split(".")
        assert len(parts) == 2

    def test_hash_is_128_hex_characters(self) -> None:
        """Hash should be 64 bytes = 128 hex characters."""
        result = hash_password("testpassword")
        hash_part = result.split(".")[0]

        assert len(hash_part) == 128
        # Verify it's valid hex
        int(hash_part, 16)

    def test_salt_is_32_hex_characters(self) -> None:
        """Salt should be 16 bytes = 32 hex characters."""
        result = hash_password("testpassword")
        salt_part = result.split(".")[1]

        assert len(salt_part) == 32
        # Verify it's valid hex
        int(salt_part, 16)

    def test_different_passwords_produce_different_hashes(self) -> None:
        """Different passwords should produce different hashes."""
        hash1 = hash_password("password1")
        hash2 = hash_password("password2")

        assert hash1 != hash2

    def test_same_password_produces_different_hashes_due_to_random_salt(self) -> None:
        """Same password hashed twice should produce different results."""
        hash1 = hash_password("samepassword")
        hash2 = hash_password("samepassword")

        assert hash1 != hash2

    def test_handles_empty_password(self) -> None:
        """Should handle empty password."""
        result = hash_password("")

        assert "." in result
        assert len(result.split(".")) == 2

    def test_handles_unicode_password(self) -> None:
        """Should handle unicode characters in password."""
        result = hash_password("пароль123")

        assert "." in result
        assert len(result.split(".")) == 2

    def test_handles_special_characters(self) -> None:
        """Should handle special characters in password."""
        result = hash_password("p@$$w0rd!#$%^&*()")

        assert "." in result
        assert len(result.split(".")) == 2


class TestVerifyPassword:
    """Tests for verify_password function."""

    def test_correct_password_returns_true(self) -> None:
        """Correct password should verify successfully."""
        password = "correctpassword"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_wrong_password_returns_false(self) -> None:
        """Wrong password should not verify."""
        hashed = hash_password("correctpassword")

        assert verify_password("wrongpassword", hashed) is False

    def test_case_sensitive(self) -> None:
        """Password verification should be case sensitive."""
        hashed = hash_password("Password")

        assert verify_password("password", hashed) is False
        assert verify_password("PASSWORD", hashed) is False
        assert verify_password("Password", hashed) is True

    def test_invalid_stored_hash_format_returns_false(self) -> None:
        """Invalid stored hash format should return False."""
        assert verify_password("password", "invalidhash") is False
        assert verify_password("password", "") is False
        assert verify_password("password", "no.dots.allowed.multiple") is False

    def test_handles_unicode_password(self) -> None:
        """Should verify unicode passwords correctly."""
        password = "пароль123"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True
        assert verify_password("wrong", hashed) is False

    def test_handles_empty_password(self) -> None:
        """Should handle empty password verification."""
        hashed = hash_password("")

        assert verify_password("", hashed) is True
        assert verify_password("notempty", hashed) is False

    def test_timing_attack_resistance(self) -> None:
        """Verification should use constant-time comparison.

        This is a basic test - real timing attack testing requires
        statistical analysis over many iterations.
        """
        # Just ensure it doesn't raise an exception
        hashed = hash_password("password")
        verify_password("x" * 1000, hashed)  # Very long wrong password
        verify_password("", hashed)  # Empty password
