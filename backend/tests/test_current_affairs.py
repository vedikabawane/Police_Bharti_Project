import unittest
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import CurrentAffair, User


class CurrentAffairsApiTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with patch.object(Config, "SQLALCHEMY_DATABASE_URI", "sqlite://"):
            cls.app = create_app()
        cls.app.config.update(TESTING=True)
        cls.client = cls.app.test_client()
        with cls.app.app_context():
            db.create_all()

    def setUp(self):
        self.context = self.app.app_context()
        self.context.push()
        db.drop_all()
        db.create_all()
        db.session.add_all([
            User(id=1, name="Student", email="student@affairs.test",
                 password_hash="secret", role="student", is_active=True),
            User(id=2, name="Admin", email="admin@affairs.test",
                 password_hash="secret", role="admin", is_active=True),
            User(id=3, name="Inactive admin", email="inactive-admin@affairs.test",
                 password_hash="secret", role="admin", is_active=False),
            User(id=4, name="Inactive student", email="inactive-student@affairs.test",
                 password_hash="secret", role="student", is_active=False),
        ])
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()

    @staticmethod
    def headers(user_id):
        token = create_access_token(identity=str(user_id))
        return {"Authorization": f"Bearer {token}"}

    @staticmethod
    def payload(**overrides):
        payload = {
            "title": "Maharashtra cabinet update",
            "summary": "A new state initiative was announced.",
            "content": "The state government announced a new public programme today.",
            "category": "महाराष्ट्र",
            "published_date": "2026-10-07",
            "source_name": "Official source",
            "source_url": "https://example.test/current-affairs",
        }
        payload.update(overrides)
        return payload

    def create_affair(self, user_id=2, **overrides):
        return self.client.post(
            "/api/admin/current-affairs",
            json=self.payload(**overrides),
            headers=self.headers(user_id),
        )

    def test_student_json_preserves_marathi_and_english_content(self):
        marathi_title = "\u092e\u0939\u093e\u0930\u093e\u0937\u094d\u091f\u094d\u0930 \u0907\u0924\u093f\u0939\u093e\u0938"
        marathi_content = "\u0936\u093f\u0935\u093e\u091c\u0940 \u092e\u0939\u093e\u0930\u093e\u091c"
        english_summary = "English summary remains unchanged."

        created = self.create_affair(
            title=marathi_title,
            summary=english_summary,
            content=f"English text. {marathi_content}",
        )
        self.assertEqual(created.status_code, 201, created.get_json())

        response = self.client.get(
            "/api/student/current-affairs?category=%E0%A4%AE%E0%A4%B9%E0%A4%BE%E0%A4%B0%E0%A4%BE%E0%A4%B7%E0%A5%8D%E0%A4%9F%E0%A5%8D%E0%A4%B0",
            headers=self.headers(1),
        )

        self.assertEqual(response.status_code, 200, response.get_json())
        self.assertTrue(response.content_type.startswith("application/json"))
        record = response.get_json()["data"]["current_affairs"][0]
        self.assertEqual(record["title"], marathi_title)
        self.assertEqual(record["summary"], english_summary)
        self.assertEqual(record["content"], f"English text. {marathi_content}")
        self.assertEqual(record["category"], "\u092e\u0939\u093e\u0930\u093e\u0937\u094d\u091f\u094d\u0930")
        for value in (record["title"], record["summary"], record["content"], record["category"]):
            self.assertNotIn("\u00c3\u00a0", value)
            self.assertNotIn("\u00c3\u201a", value)
            self.assertNotIn("\u00ef\u00bf\u00bd", value)

    def test_admin_can_create_current_affair_with_safe_fields(self):
        response = self.create_affair()
        self.assertEqual(response.status_code, 201, response.get_json())
        data = response.get_json()["data"]
        self.assertEqual(data["title"], "Maharashtra cabinet update")
        self.assertEqual(data["published_date"], "2026-10-07")
        self.assertTrue(data["is_active"])
        self.assertEqual(CurrentAffair.query.count(), 1)

    def test_non_admin_and_inactive_admin_cannot_create(self):
        payload = self.payload()
        self.assertEqual(self.create_affair(user_id=1).status_code, 403)
        self.assertEqual(self.create_affair(user_id=3).status_code, 403)
        self.assertEqual(self.client.post(
            "/api/admin/current-affairs", json=payload
        ).status_code, 401)
        self.assertEqual(CurrentAffair.query.count(), 0)

    def test_admin_can_list_filter_search_update_and_change_status(self):
        first = self.create_affair().get_json()["data"]
        second = self.create_affair(
            title="India science mission",
            summary="Research milestone",
            content="A science mission reached a milestone.",
            category="विज्ञान",
            published_date="2026-10-06",
            source_name=None,
            source_url=None,
        ).get_json()["data"]
        self.client.patch(
            f"/api/admin/current-affairs/{second['id']}/status",
            headers=self.headers(2), json={"is_active": False},
        )

        all_items = self.client.get(
            "/api/admin/current-affairs", headers=self.headers(2)
        )
        self.assertEqual(all_items.status_code, 200)
        self.assertEqual(
            [item["id"] for item in all_items.get_json()["data"]["current_affairs"]],
            [first["id"], second["id"]],
        )
        searched = self.client.get(
            "/api/admin/current-affairs?search=milestone&category=%E0%A4%B5%E0%A4%BF%E0%A4%9C%E0%A5%8D%E0%A4%9E%E0%A4%BE%E0%A4%A8&is_active=false",
            headers=self.headers(2),
        ).get_json()["data"]["current_affairs"]
        self.assertEqual([item["id"] for item in searched], [second["id"]])
        active = self.client.get(
            "/api/admin/current-affairs?is_active=true",
            headers=self.headers(2),
        ).get_json()["data"]["current_affairs"]
        self.assertEqual([item["id"] for item in active], [first["id"]])

        updated = self.client.patch(
            f"/api/admin/current-affairs/{first['id']}",
            headers=self.headers(2),
            json={"title": "Updated headline", "content": "Updated article text."},
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.get_json()["data"]["title"], "Updated headline")
        self.assertEqual(updated.get_json()["data"]["content"], "Updated article text.")
        activated = self.client.patch(
            f"/api/admin/current-affairs/{second['id']}/status",
            headers=self.headers(2), json={"is_active": True},
        )
        self.assertEqual(activated.status_code, 200)
        self.assertTrue(activated.get_json()["data"]["is_active"])

    def test_admin_date_filter_and_pagination(self):
        self.create_affair(title="Older", published_date="2026-10-05")
        self.create_affair(title="Newer", published_date="2026-10-07")
        filtered = self.client.get(
            "/api/admin/current-affairs?published_date=2026-10-05",
            headers=self.headers(2),
        ).get_json()["data"]
        self.assertEqual(filtered["pagination"]["total"], 1)
        self.assertEqual(filtered["current_affairs"][0]["title"], "Older")
        page = self.client.get(
            "/api/admin/current-affairs?page=2&per_page=1",
            headers=self.headers(2),
        ).get_json()["data"]
        self.assertEqual(page["pagination"], {
            "page": 2, "per_page": 1, "total": 2, "pages": 2,
        })
        self.assertEqual(page["current_affairs"][0]["title"], "Older")

    def test_student_only_sees_active_records_and_safe_detail_fields(self):
        active = self.create_affair().get_json()["data"]
        inactive = self.create_affair(title="Draft").get_json()["data"]
        self.client.patch(
            f"/api/admin/current-affairs/{inactive['id']}/status",
            headers=self.headers(2), json={"is_active": False},
        )

        response = self.client.get(
            "/api/student/current-affairs", headers=self.headers(1)
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual([item["id"] for item in data["current_affairs"]], [active["id"]])
        self.assertNotIn("is_active", data["current_affairs"][0])
        self.assertNotIn("created_at", data["current_affairs"][0])

        detail = self.client.get(
            f"/api/student/current-affairs/{active['id']}", headers=self.headers(1)
        )
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(set(detail.get_json()["data"]), {
            "id", "title", "summary", "content", "category", "published_date",
            "source_name", "source_url",
        })
        hidden = self.client.get(
            f"/api/student/current-affairs/{inactive['id']}", headers=self.headers(1)
        )
        self.assertEqual(hidden.status_code, 404)

    def test_student_search_category_date_and_pagination(self):
        self.create_affair(title="Maharashtra budget", published_date="2026-10-06")
        self.create_affair(
            title="International science", category="आंतरराष्ट्रीय",
            published_date="2026-10-07",
        )
        search = self.client.get(
            "/api/student/current-affairs?search=budget&date=2026-10-06",
            headers=self.headers(1),
        ).get_json()["data"]["current_affairs"]
        self.assertEqual([item["title"] for item in search], ["Maharashtra budget"])
        category = self.client.get(
            "/api/student/current-affairs?category=%E0%A4%86%E0%A4%82%E0%A4%A4%E0%A4%B0%E0%A4%B0%E0%A4%BE%E0%A4%B7%E0%A5%8D%E0%A4%9F%E0%A5%8D%E0%A4%B0%E0%A5%80%E0%A4%AF",
            headers=self.headers(1),
        ).get_json()["data"]["current_affairs"]
        self.assertEqual([item["title"] for item in category], ["International science"])
        page = self.client.get(
            "/api/student/current-affairs?page=2&per_page=1",
            headers=self.headers(1),
        ).get_json()["data"]
        self.assertEqual(page["pagination"]["total"], 2)
        self.assertEqual(page["current_affairs"][0]["title"], "Maharashtra budget")

    def test_invalid_dates_urls_and_filters_are_rejected(self):
        for invalid_date in ("not-a-date", "2026-02-30"):
            response = self.create_affair(published_date=invalid_date)
            self.assertEqual(response.status_code, 422)
        for invalid_url in ("javascript:alert(1)", "ftp://example.test/file", "not a url"):
            response = self.create_affair(source_url=invalid_url)
            self.assertEqual(response.status_code, 422)
        self.assertEqual(self.client.get(
            "/api/admin/current-affairs?published_date=bad-date",
            headers=self.headers(2),
        ).status_code, 400)
        self.assertEqual(CurrentAffair.query.count(), 0)

    def test_unknown_ids_and_student_authorization(self):
        self.assertEqual(self.client.get(
            "/api/admin/current-affairs/999", headers=self.headers(2)
        ).status_code, 404)
        self.assertEqual(self.client.patch(
            "/api/admin/current-affairs/999", headers=self.headers(2),
            json={"title": "No record"},
        ).status_code, 404)
        self.assertEqual(self.client.get(
            "/api/student/current-affairs", headers=self.headers(4)
        ).status_code, 403)
        self.assertEqual(self.client.get("/api/student/current-affairs").status_code, 401)

    def test_hard_delete_removes_unreferenced_content(self):
        current_affair = self.create_affair().get_json()["data"]
        response = self.client.delete(
            f"/api/admin/current-affairs/{current_affair['id']}",
            headers=self.headers(2),
        )
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(db.session.get(CurrentAffair, current_affair["id"]))
        self.assertEqual(self.client.delete(
            f"/api/admin/current-affairs/{current_affair['id']}",
            headers=self.headers(2),
        ).status_code, 404)


if __name__ == "__main__":
    unittest.main()
