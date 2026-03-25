"""SQLAlchemy User repository implementation.

Implements IUserRepository interface using SQLAlchemy async operations.
"""

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities import User
from src.domain.interfaces import IUserRepository
from src.domain.value_objects import SubscriptionStatus
from src.infrastructure.database.models import User as UserModel

from .base import SQLAlchemyRepository


class UserRepository(SQLAlchemyRepository[User, UserModel, str], IUserRepository):
    """SQLAlchemy implementation of IUserRepository.

    Provides user-specific data access operations.
    """

    def __init__(self, session: AsyncSession) -> None:
        """Initialize user repository.

        Args:
            session: SQLAlchemy async session
        """
        super().__init__(session, UserModel)

    def _to_entity(self, model: UserModel) -> User:
        """Convert UserModel to User entity.

        Args:
            model: SQLAlchemy UserModel instance

        Returns:
            User domain entity
        """
        return User(
            id=model.id,
            email=model.email,
            password=model.password,
            first_name=model.first_name,
            last_name=model.last_name,
            profile_image_url=model.profile_image_url,
            stripe_customer_id=model.stripe_customer_id,
            subscription_status=SubscriptionStatus(model.subscription_status or "free"),
            subscription_id=model.subscription_id,
            free_answers_used=model.free_answers_used or 0,
            starter_interviews_used=model.starter_interviews_used or 0,
            starter_expires_at=model.starter_expires_at,
            milestone_sent_70=model.milestone_sent_70 or False,
            milestone_sent_80=model.milestone_sent_80 or False,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    def _to_model(self, entity: User) -> UserModel:
        """Convert User entity to UserModel.

        Args:
            entity: User domain entity

        Returns:
            SQLAlchemy UserModel instance
        """
        return UserModel(
            id=entity.id,
            email=entity.email,
            password=entity.password,
            first_name=entity.first_name,
            last_name=entity.last_name,
            profile_image_url=entity.profile_image_url,
            stripe_customer_id=entity.stripe_customer_id,
            subscription_status=entity.subscription_status.value,
            subscription_id=entity.subscription_id,
            free_answers_used=entity.free_answers_used,
            starter_interviews_used=entity.starter_interviews_used,
            starter_expires_at=entity.starter_expires_at,
            milestone_sent_70=entity.milestone_sent_70,
            milestone_sent_80=entity.milestone_sent_80,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

    def _update_model(self, model: UserModel, entity: User) -> UserModel:
        """Update existing UserModel with entity data.

        Args:
            model: Existing SQLAlchemy UserModel
            entity: User entity with updated data

        Returns:
            Updated UserModel
        """
        model.email = entity.email
        model.password = entity.password
        model.first_name = entity.first_name
        model.last_name = entity.last_name
        model.profile_image_url = entity.profile_image_url
        model.stripe_customer_id = entity.stripe_customer_id
        model.subscription_status = entity.subscription_status.value
        model.subscription_id = entity.subscription_id
        model.free_answers_used = entity.free_answers_used
        model.starter_interviews_used = entity.starter_interviews_used
        model.starter_expires_at = entity.starter_expires_at
        model.milestone_sent_70 = entity.milestone_sent_70
        model.milestone_sent_80 = entity.milestone_sent_80
        model.updated_at = entity.updated_at
        return model

    async def get_by_email(self, email: str) -> User | None:
        """Find a user by email address.

        Args:
            email: User's email address

        Returns:
            The user if found, None otherwise
        """
        stmt = select(UserModel).where(UserModel.email == email)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None:
            return None

        return self._to_entity(model)

    async def get_by_stripe_customer_id(self, customer_id: str) -> User | None:
        """Find a user by Stripe customer ID.

        Args:
            customer_id: Stripe customer identifier

        Returns:
            The user if found, None otherwise
        """
        stmt = select(UserModel).where(UserModel.stripe_customer_id == customer_id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None:
            return None

        return self._to_entity(model)

    async def get_by_subscription_status(
        self,
        status: SubscriptionStatus,
        limit: int | None = None,
    ) -> list[User]:
        """Find all users with a specific subscription status.

        Args:
            status: Subscription status to filter by
            limit: Maximum number of users to return

        Returns:
            List of users with the specified status
        """
        stmt = select(UserModel).where(UserModel.subscription_status == status.value)

        if limit is not None:
            stmt = stmt.limit(limit)

        result = await self._session.execute(stmt)
        models = result.scalars().all()

        return [self._to_entity(model) for model in models]

    async def update_subscription(
        self,
        user_id: str,
        status: SubscriptionStatus,
        subscription_id: str | None = None,
    ) -> User | None:
        """Update a user's subscription status.

        Args:
            user_id: User's unique identifier
            status: New subscription status
            subscription_id: Stripe subscription ID

        Returns:
            Updated user if found, None otherwise
        """
        model = await self._get_model_by_id(user_id)
        if model is None:
            return None

        model.subscription_status = status.value
        if subscription_id is not None:
            model.subscription_id = subscription_id

        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def increment_free_answers(self, user_id: str) -> User | None:
        """Increment the free answers used counter.

        Args:
            user_id: User's unique identifier

        Returns:
            Updated user if found, None otherwise
        """
        model = await self._get_model_by_id(user_id)
        if model is None:
            return None

        model.free_answers_used = (model.free_answers_used or 0) + 1

        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def increment_starter_interviews(self, user_id: str) -> User | None:
        """Increment the starter interviews used counter.

        Args:
            user_id: User's unique identifier

        Returns:
            Updated user if found, None otherwise
        """
        model = await self._get_model_by_id(user_id)
        if model is None:
            return None

        model.starter_interviews_used = (model.starter_interviews_used or 0) + 1

        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def email_exists(self, email: str) -> bool:
        """Check if an email is already registered.

        Args:
            email: Email address to check

        Returns:
            True if email exists, False otherwise
        """
        user = await self.get_by_email(email)
        return user is not None
