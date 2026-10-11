import unittest
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import AboutPageContent, ContactMessage, ContactSettings, User
from app.services import site_content_service


ABOUT = {
    "hero_title": "Police Bharti तयारी", "hero_subtitle": "अभ्यास आणि सराव",
    "introduction": "Platform information", "purpose": "Purpose", "mission": "Mission", "vision": "Vision",
    "study_features": "Study", "test_features": "Tests", "physical_training_info": "Training",
    "current_affairs_info": "Current affairs", "recruitment_info": "Notices", "ai_assistant_info": "Assistant",
    "performance_info": "Performance", "free_platform_info": "Free", "contact_cta": "Contact us",
}
CONTACT = {"heading": "Contact", "description": "Send a message", "email": "team@example.test", "phone": "", "address": "", "working_hours": "", "support_note": "", "map_url": ""}
MESSAGE = {"name": "A Student", "email": "student@example.test", "mobile": "9876543210", "subject": "A question", "message": "Please help with the platform."}


class AboutContactApiTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with patch.object(Config, "SQLALCHEMY_DATABASE_URI", "sqlite://"):
            cls.app = create_app()
        cls.app.config.update(TESTING=True, JWT_SECRET_KEY="test-secret")
        cls.client = cls.app.test_client()
        with cls.app.app_context(): db.create_all()

    def setUp(self):
        self.context = self.app.app_context(); self.context.push()
        db.drop_all(); db.create_all()
        db.session.add_all([
            User(id=1, name="Student", email="student@site.test", password_hash="x", role="student", is_active=True),
            User(id=2, name="Admin", email="admin@site.test", password_hash="x", role="admin", is_active=True),
            User(id=3, name="Inactive admin", email="inactive@site.test", password_hash="x", role="admin", is_active=False),
        ])
        db.session.commit()

    def tearDown(self):
        db.session.remove(); db.drop_all(); self.context.pop()

    @staticmethod
    def headers(user_id): return {"Authorization": f"Bearer {create_access_token(identity=str(user_id))}"}

    def test_public_about_and_inactive_content(self):
        self.assertEqual(self.client.get("/api/public/about").status_code, 404)
        db.session.add(AboutPageContent(**ABOUT, is_active=False)); db.session.commit()
        self.assertEqual(self.client.get("/api/public/about").status_code, 404)
        db.session.query(AboutPageContent).update({"is_active": True}); db.session.commit()
        response = self.client.get("/api/public/about")
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("created_at", response.get_json()["data"])

    def test_admin_can_create_and_update_about_and_others_cannot(self):
        self.assertEqual(self.client.post("/api/admin/about", json=ABOUT).status_code, 401)
        self.assertEqual(self.client.post("/api/admin/about", json=ABOUT, headers=self.headers(1)).status_code, 403)
        self.assertEqual(self.client.post("/api/admin/about", json=ABOUT, headers=self.headers(3)).status_code, 403)
        created = self.client.post("/api/admin/about", json=ABOUT, headers=self.headers(2))
        self.assertEqual(created.status_code, 200, created.get_json())
        updated = self.client.patch("/api/admin/about", json={**ABOUT, "mission": "Updated mission"}, headers=self.headers(2))
        self.assertEqual(updated.get_json()["data"]["mission"], "Updated mission")

    def test_public_contact_settings_and_unsafe_map_url(self):
        self.assertEqual(self.client.get("/api/public/contact").status_code, 404)
        invalid = {**CONTACT, "map_url": "javascript:alert(1)"}
        response = self.client.post("/api/admin/contact-settings", json=invalid, headers=self.headers(2))
        self.assertEqual(response.status_code, 422)
        self.client.post("/api/admin/contact-settings", json={**CONTACT, "map_url": "https://maps.example.test"}, headers=self.headers(2))
        public = self.client.get("/api/public/contact").get_json()["data"]
        self.assertEqual(public["map_url"], "https://maps.example.test")
        self.assertNotIn("is_active", public)

    def test_contact_settings_permissions(self):
        self.assertEqual(self.client.post("/api/admin/contact-settings", json=CONTACT, headers=self.headers(1)).status_code, 403)
        self.assertEqual(self.client.post("/api/admin/contact-settings", json=CONTACT, headers=self.headers(3)).status_code, 403)
        self.assertEqual(self.client.post("/api/admin/contact-settings", json=CONTACT, headers=self.headers(2)).status_code, 200)

    def test_contact_form_validation_storage_privacy_and_rate_limit(self):
        self.assertEqual(self.client.post("/api/public/contact", json={**MESSAGE, "email": "bad"}).status_code, 422)
        self.assertEqual(self.client.post("/api/public/contact", json={**MESSAGE, "message": ""}).status_code, 422)
        self.assertEqual(self.client.post("/api/public/contact", json={**MESSAGE, "message": "x" * 3001}).status_code, 422)
        response = self.client.post("/api/public/contact", json=MESSAGE)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ContactMessage.query.count(), 1)
        self.assertNotIn("id", response.get_json())
        self.assertNotIn("contact-messages", str(self.client.get("/api/public/contact").get_json()))
        for _ in range(4): self.client.post("/api/public/contact", json=MESSAGE)
        self.assertEqual(self.client.post("/api/public/contact", json=MESSAGE).status_code, 429)

    def test_admin_message_search_pagination_status_timestamps_and_notes(self):
        for name in ["A Student", "Another Student", "Third Student"]:
            db.session.add(ContactMessage(name=name, email=f"{name.split()[0].lower()}@example.test", subject="Platform help", message="Searchable detail", status="NEW"))
        db.session.commit()
        self.assertEqual(self.client.get("/api/admin/contact-messages", headers=self.headers(1)).status_code, 403)
        self.assertEqual(self.client.get("/api/admin/contact-messages", headers=self.headers(3)).status_code, 403)
        response = self.client.get("/api/admin/contact-messages?search=Searchable&page=1&per_page=2", headers=self.headers(2))
        self.assertEqual(response.status_code, 200); self.assertEqual(response.get_json()["data"]["pagination"]["total"], 3)
        first = response.get_json()["data"]["items"][0]["id"]
        self.assertEqual(self.client.get(f"/api/admin/contact-messages/{first}", headers=self.headers(2)).status_code, 200)
        changed = self.client.patch(f"/api/admin/contact-messages/{first}/status", json={"status": "READ"}, headers=self.headers(2))
        self.assertIsNotNone(changed.get_json()["data"]["read_at"])
        changed = self.client.patch(f"/api/admin/contact-messages/{first}/status", json={"status": "REPLIED"}, headers=self.headers(2))
        self.assertIsNotNone(changed.get_json()["data"]["replied_at"])
        self.client.patch(f"/api/admin/contact-messages/{first}/notes", json={"admin_notes": "Private"}, headers=self.headers(2))
        self.assertNotIn("Private", str(self.client.get("/api/public/contact", headers=self.headers(2)).get_json()))
        archived = self.client.patch(f"/api/admin/contact-messages/{first}/status", json={"status": "ARCHIVED"}, headers=self.headers(2))
        self.assertEqual(archived.get_json()["data"]["status"], "ARCHIVED")
        self.assertEqual(ContactMessage.query.count(), 3)


if __name__ == "__main__": unittest.main()
