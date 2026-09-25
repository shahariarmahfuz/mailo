"""Initial schema with users, mailboxes, emails, and attachments

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-25 18:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # 2. Mailboxes table
    op.create_table(
        'mailboxes',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('address', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False, server_default='Default Mailbox'),
        sa.Column('is_primary', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_mailboxes_user_id', 'mailboxes', ['user_id'])
    op.create_index('ix_mailboxes_address', 'mailboxes', ['address'], unique=True)
    op.create_index('ix_mailboxes_is_active', 'mailboxes', ['is_active'])
    op.create_index('idx_mailbox_user_active', 'mailboxes', ['user_id', 'is_active'])

    # 3. Emails table
    op.create_table(
        'emails',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('mailbox_id', sa.String(length=36), sa.ForeignKey('mailboxes.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('sender', sa.String(length=500), nullable=False),
        sa.Column('recipient', sa.String(length=500), nullable=False),
        sa.Column('cc', sa.Text(), nullable=True),
        sa.Column('bcc', sa.Text(), nullable=True),
        sa.Column('subject', sa.String(length=1000), nullable=False, server_default='(No Subject)'),
        sa.Column('message_id', sa.String(length=500), nullable=True),
        sa.Column('in_reply_to', sa.String(length=500), nullable=True),
        sa.Column('references', sa.Text(), nullable=True),
        sa.Column('received_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('is_starred', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('plain_text_body', sa.Text(), nullable=True),
        sa.Column('html_body', sa.Text(), nullable=True),
        sa.Column('raw_storage_key', sa.String(length=500), nullable=True),
        sa.Column('size_bytes', sa.Integer(), nullable=False, server_default='0'),
    )
    op.create_index('ix_emails_mailbox_id', 'emails', ['mailbox_id'])
    op.create_index('ix_emails_user_id', 'emails', ['user_id'])
    op.create_index('ix_emails_recipient', 'emails', ['recipient'])
    op.create_index('ix_emails_message_id', 'emails', ['message_id'])
    op.create_index('ix_emails_received_at', 'emails', ['received_at'])
    op.create_index('ix_emails_is_read', 'emails', ['is_read'])
    op.create_index('ix_emails_is_starred', 'emails', ['is_starred'])
    op.create_index('idx_emails_user_received', 'emails', ['user_id', 'received_at'])
    op.create_index('idx_emails_mailbox_received', 'emails', ['mailbox_id', 'received_at'])
    op.create_index('idx_emails_user_read', 'emails', ['user_id', 'is_read'])
    op.create_index('idx_emails_user_starred', 'emails', ['user_id', 'is_starred'])

    # 4. Email Attachments table
    op.create_table(
        'email_attachments',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('email_id', sa.String(length=36), sa.ForeignKey('emails.id', ondelete='CASCADE'), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('content_type', sa.String(length=100), nullable=False, server_default='application/octet-stream'),
        sa.Column('size_bytes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('storage_path', sa.String(length=500), nullable=True),
    )
    op.create_index('ix_email_attachments_email_id', 'email_attachments', ['email_id'])


def downgrade() -> None:
    op.drop_table('email_attachments')
    op.drop_table('emails')
    op.drop_table('mailboxes')
    op.drop_table('users')
