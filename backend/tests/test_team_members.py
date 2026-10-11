import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import User, WebsiteTeamMember


class TeamMemberApiTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with patch.object(Config, "SQLALCHEMY_DATABASE_URI", "sqlite://"):
            cls.app = create_app()
        cls.app.config.update(TESTING=True, JWT_SECRET_KEY="test-secret")
        cls.client = cls.app.test_client()

    def setUp(self):
        self.context = self.app.app_context()
        self.context.push()
        db.drop_all()
        db.create_all()
        db.session.add_all([
            User(id=1, name="Student", email="student@site.test", password_hash="x", role="student", is_active=True),
            User(id=2, name="Admin", email="admin@site.test", password_hash="x", role="admin", is_active=True),
            User(id=3, name="Inactive admin", email="inactive@site.test", password_hash="x", role="admin", is_active=False),
        ])
        db.session.commit()
        self.temp_directory = tempfile.TemporaryDirectory()
        self.directory = Path(self.temp_directory.name)
        self.storage_patch = patch("app.utils.team_member_photo_storage.get_team_member_photo_directory", return_value=self.directory)
        self.storage_patch.start()
        self.controller_storage_patch = patch("app.controllers.site_content_controller.get_team_member_photo_directory", return_value=self.directory)
        self.controller_storage_patch.start()

    def tearDown(self):
        self.controller_storage_patch.stop()
        self.storage_patch.stop()
        db.session.remove()
        db.drop_all()
        self.context.pop()
        self.temp_directory.cleanup()

    @staticmethod
    def headers(user_id):
        return {"Authorization": f"Bearer {create_access_token(identity=str(user_id))}"}

    def create_member(self, **overrides):
        payload = {"name": "Asha Patil", "role": "Content Manager", "bio": "Keeps study content current.", "email": "asha@example.test", "mobile": "9876543210", "location": "Pune", "display_order": 2}
        payload.update(overrides)
        response = self.client.post("/api/admin/site-content/team-members", json=payload, headers=self.headers(2))
        self.assertEqual(response.status_code, 201, response.get_json())
        return response.get_json()["data"]

    def test_permissions_create_validation_and_private_data(self):
        path = "/api/admin/site-content/team-members"
        self.assertEqual(self.client.post(path, json={"name": "A", "role": "B"}).status_code, 401)
        self.assertEqual(self.client.post(path, json={"name": "A", "role": "B"}, headers=self.headers(1)).status_code, 403)
        self.assertEqual(self.client.post(path, json={"name": "A", "role": "B"}, headers=self.headers(3)).status_code, 403)
        self.assertEqual(self.client.post(path, json={"name": " ", "role": "B"}, headers=self.headers(2)).status_code, 422)
        self.assertEqual(self.client.post(path, json={"name": "A", "role": "B", "email": "bad"}, headers=self.headers(2)).status_code, 422)
        self.assertEqual(self.client.post(path, json={"name": "A", "role": "B", "mobile": "phone"}, headers=self.headers(2)).status_code, 422)
        self.assertEqual(self.client.post(path, json={"name": "A", "role": "B", "display_order": -1}, headers=self.headers(2)).status_code, 422)
        member = self.create_member(email=None, mobile=None)
        self.assertNotIn("password", str(member))
        self.assertNotIn("password_hash", str(member))
        self.assertNotIn("photo_storage_key", member)
        self.assertIn("is_active", member)

    def test_admin_search_filter_pagination_order_update_status_and_delete(self):
        first = self.create_member(name="Asha Patil", role="Content Manager", display_order=4)
        second = self.create_member(name="Ravi Deshmukh", role="Support Team", bio="Answers student questions", display_order=1)
        third = self.create_member(name="Mina Shah", role="Founder", bio="Platform founder", display_order=1)
        path = "/api/admin/site-content/team-members"
        self.assertEqual(self.client.get(path, headers=self.headers(1)).status_code, 403)
        self.assertEqual(self.client.get(path, headers=self.headers(3)).status_code, 403)
        result = self.client.get(f"{path}?search=questions&page=1&per_page=1", headers=self.headers(2)).get_json()["data"]
        self.assertEqual(result["pagination"]["total"], 1)
        self.assertEqual(result["items"][0]["id"], second["id"])
        ordered = self.client.get(f"{path}?is_active=true", headers=self.headers(2)).get_json()["data"]["items"]
        self.assertEqual([item["id"] for item in ordered], [second["id"], third["id"], first["id"]])
        self.assertEqual(self.client.get(f"{path}?is_active=invalid", headers=self.headers(2)).status_code, 400)
        updated = self.client.patch(f"{path}/{first['id']}", json={"bio": "Updated"}, headers=self.headers(2))
        self.assertEqual(updated.get_json()["data"]["bio"], "Updated")
        self.assertEqual(self.client.patch(f"{path}/{first['id']}/status", json={"is_active": False}, headers=self.headers(2)).status_code, 200)
        public = self.client.get("/api/public/contact/team-members").get_json()["data"]
        self.assertEqual([item["id"] for item in public], [second["id"], third["id"]])
        self.assertEqual(self.client.delete(f"{path}/{first['id']}", headers=self.headers(2)).status_code, 200)
        self.assertIsNone(db.session.get(WebsiteTeamMember, first["id"]))

    def test_photo_validation_public_active_access_replacement_and_delete_cleanup(self):
        path = "/api/admin/site-content/team-members"
        invalid = self.client.post(path, data={"name": "Bad", "role": "Test", "photo": (io.BytesIO(b"not image"), "bad.jpg", "image/jpeg")}, headers=self.headers(2), content_type="multipart/form-data")
        self.assertEqual(invalid.status_code, 422)
        oversized = b"\xff\xd8\xff" + b"x" * (5 * 1024 * 1024)
        too_large = self.client.post(path, data={"name": "Large", "role": "Test", "photo": (io.BytesIO(oversized), "large.jpg", "image/jpeg")}, headers=self.headers(2), content_type="multipart/form-data")
        self.assertEqual(too_large.status_code, 422)
        created = self.client.post(path, data={"name": "Photo Person", "role": "Founder", "photo": (io.BytesIO(b"\xff\xd8\xfffirst"), "../../person.jpg", "image/jpeg")}, headers=self.headers(2), content_type="multipart/form-data")
        self.assertEqual(created.status_code, 201, created.get_json())
        member_id = created.get_json()["data"]["id"]
        old_key = WebsiteTeamMember.query.get(member_id).photo_storage_key
        self.assertTrue((self.directory / old_key).is_file())
        public = self.client.get(f"/api/public/team-members/{member_id}/photo")
        self.assertEqual(public.status_code, 200)
        self.assertEqual(public.mimetype, "image/jpeg")
        public.close()
        self.assertEqual(self.client.patch(f"{path}/{member_id}/status", json={"is_active": False}, headers=self.headers(2)).status_code, 200)
        self.assertEqual(self.client.get(f"/api/public/team-members/{member_id}/photo").status_code, 404)
        self.client.patch(f"{path}/{member_id}/status", json={"is_active": True}, headers=self.headers(2))
        replaced = self.client.patch(f"{path}/{member_id}", data={"photo": (io.BytesIO(b"\xff\xd8\xffsecond"), "new.jpeg")}, headers=self.headers(2), content_type="multipart/form-data")
        self.assertEqual(replaced.status_code, 200, replaced.get_json())
        new_key = WebsiteTeamMember.query.get(member_id).photo_storage_key
        self.assertNotEqual(new_key, old_key)
        self.assertFalse((self.directory / old_key).exists())
        self.assertTrue((self.directory / new_key).exists())
        self.assertEqual(self.client.delete(f"{path}/{member_id}", headers=self.headers(2)).status_code, 200)
        self.assertFalse((self.directory / new_key).exists())


if __name__ == "__main__":
    unittest.main()
