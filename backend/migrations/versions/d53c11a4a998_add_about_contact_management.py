"""add about and contact management

Revision ID: d53c11a4a998
Revises: b372dab7524b
Create Date: 2026-10-08
"""
from alembic import op
import sqlalchemy as sa

revision = "d53c11a4a998"
down_revision = "8f32ac91624a"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "about_page_content",
        sa.Column("id", sa.BigInteger().with_variant(sa.Integer(), "sqlite"), primary_key=True, autoincrement=True),
        sa.Column("hero_title", sa.String(200), nullable=False),
        sa.Column("hero_subtitle", sa.String(500), nullable=False),
        sa.Column("introduction", sa.Text(), nullable=False),
        sa.Column("purpose", sa.Text(), nullable=False),
        sa.Column("mission", sa.Text(), nullable=False),
        sa.Column("vision", sa.Text(), nullable=False),
        sa.Column("study_features", sa.Text(), nullable=False),
        sa.Column("test_features", sa.Text(), nullable=False),
        sa.Column("physical_training_info", sa.Text(), nullable=False),
        sa.Column("current_affairs_info", sa.Text(), nullable=False),
        sa.Column("recruitment_info", sa.Text(), nullable=False),
        sa.Column("ai_assistant_info", sa.Text(), nullable=False),
        sa.Column("performance_info", sa.Text(), nullable=False),
        sa.Column("free_platform_info", sa.Text(), nullable=False),
        sa.Column("contact_cta", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "contact_settings",
        sa.Column("id", sa.BigInteger().with_variant(sa.Integer(), "sqlite"), primary_key=True, autoincrement=True),
        sa.Column("heading", sa.String(200), nullable=False, server_default="Contact"),
        sa.Column("description", sa.String(1000), nullable=False, server_default=""),
        sa.Column("email", sa.String(255)), sa.Column("phone", sa.String(20)),
        sa.Column("address", sa.String(1000)), sa.Column("working_hours", sa.String(300)),
        sa.Column("support_note", sa.String(1000)), sa.Column("map_url", sa.String(1000)),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "contact_messages",
        sa.Column("id", sa.BigInteger().with_variant(sa.Integer(), "sqlite"), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(100), nullable=False), sa.Column("email", sa.String(255), nullable=False),
        sa.Column("mobile", sa.String(20)), sa.Column("subject", sa.String(200), nullable=False),
        sa.Column("message", sa.String(3000), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="NEW"),
        sa.Column("admin_notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("read_at", sa.DateTime()), sa.Column("replied_at", sa.DateTime()),
    )
    op.create_index("ix_contact_messages_created_at", "contact_messages", ["created_at"])
    op.create_index("ix_contact_messages_status", "contact_messages", ["status"])
    op.create_index("ix_contact_messages_email", "contact_messages", ["email"])
    op.create_index("ix_contact_messages_mobile", "contact_messages", ["mobile"])
    op.create_index("ix_contact_messages_created_status", "contact_messages", ["created_at", "status"])

    about = sa.table(
        "about_page_content",
        sa.column("hero_title", sa.String(200)), sa.column("hero_subtitle", sa.String(500)),
        sa.column("introduction", sa.Text()), sa.column("purpose", sa.Text()),
        sa.column("mission", sa.Text()), sa.column("vision", sa.Text()),
        sa.column("study_features", sa.Text()), sa.column("test_features", sa.Text()),
        sa.column("physical_training_info", sa.Text()), sa.column("current_affairs_info", sa.Text()),
        sa.column("recruitment_info", sa.Text()), sa.column("ai_assistant_info", sa.Text()),
        sa.column("performance_info", sa.Text()), sa.column("free_platform_info", sa.Text()),
        sa.column("contact_cta", sa.Text()), sa.column("is_active", sa.Boolean()),
    )
    op.bulk_insert(about, [{
        "hero_title": "Police Bharti तयारीसाठी एकाच ठिकाणी",
        "hero_subtitle": "अभ्यास, सराव आणि प्रगतीचा मागोवा घेण्यासाठी विद्यार्थ्यांसाठी तयार केलेले व्यासपीठ.",
        "introduction": "Police Bharti Platform महाराष्ट्र पोलीस भरती परीक्षेची तयारी करणाऱ्या विद्यार्थ्यांसाठी अभ्यास आणि सरावाची साधने एकत्र आणते.",
        "purpose": "विषयानुसार अभ्यास साहित्य, प्रश्नांचा सराव आणि तयारीचे नियोजन एका ठिकाणी उपलब्ध करून देणे.",
        "mission": "विद्यार्थ्यांना सातत्यपूर्ण अभ्यास आणि शारीरिक तयारीसाठी उपयुक्त डिजिटल साधने देणे.",
        "vision": "Police Bharti तयारी अधिक व्यवस्थित आणि विद्यार्थ्यांच्या गरजांशी सुसंगत करणे.",
        "study_features": "विषयानुसार अभ्यास साहित्य, विषय आणि टॉपिकनुसार सामग्री.",
        "test_features": "प्रश्नसंच, सराव चाचण्या आणि मागील वर्षांच्या प्रश्नपत्रिका/PDF.",
        "physical_training_info": "धावणे आणि इतर शारीरिक प्रशिक्षणाचा वैयक्तिक प्रगती मागोवा.",
        "current_affairs_info": "चालू घडामोडींचे लेख आणि त्यांचे वर्गीकरण.",
        "recruitment_info": "भरतीविषयक सूचना आणि उपलब्ध अधिकृत स्रोतांच्या दुव्यांसह माहिती.",
        "ai_assistant_info": "मराठी AI सहाय्यकाद्वारे अभ्यासविषयक प्रश्न विचारण्याची सुविधा.",
        "performance_info": "चाचण्यांमधील कामगिरी आणि अभ्यासातील प्रगती पाहण्याची साधने.",
        "free_platform_info": "विद्यार्थी खाते वापरून उपलब्ध प्लॅटफॉर्म साधने विनामूल्य वापरता येतात.",
        "contact_cta": "सूचना किंवा प्रश्न असल्यास संपर्क पृष्ठावरील फॉर्मद्वारे संदेश पाठवा.",
        "is_active": True,
    }])


def downgrade():
    op.drop_index("ix_contact_messages_created_status", table_name="contact_messages")
    op.drop_index("ix_contact_messages_mobile", table_name="contact_messages")
    op.drop_index("ix_contact_messages_email", table_name="contact_messages")
    op.drop_index("ix_contact_messages_status", table_name="contact_messages")
    op.drop_index("ix_contact_messages_created_at", table_name="contact_messages")
    op.drop_table("contact_messages")
    op.drop_table("contact_settings")
    op.drop_table("about_page_content")
