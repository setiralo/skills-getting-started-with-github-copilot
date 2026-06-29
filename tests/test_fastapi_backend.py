import copy

import pytest
from fastapi.testclient import TestClient

from src.app import activities, app


@pytest.fixture(autouse=True)
def reset_activities():
    original_state = copy.deepcopy(activities)
    activities.clear()
    activities.update(copy.deepcopy(original_state))
    yield
    activities.clear()
    activities.update(copy.deepcopy(original_state))


@pytest.fixture()
def client():
    return TestClient(app)


def test_root_redirects_to_static_homepage(client):
    response = client.get("/", follow_redirects=False)

    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"


def test_get_activities_returns_seed_data(client):
    response = client.get("/activities")

    assert response.status_code == 200
    payload = response.json()
    assert "Chess Club" in payload
    assert payload["Chess Club"]["participants"] == [
        "michael@mergington.edu",
        "daniel@mergington.edu",
    ]


def test_signup_for_activity_adds_participant(client):
    response = client.post("/activities/Chess Club/signup?email=student@mergington.edu")

    assert response.status_code == 200
    assert response.json() == {
        "message": "Signed up student@mergington.edu for Chess Club"
    }

    activities_response = client.get("/activities")
    assert "student@mergington.edu" in activities_response.json()["Chess Club"]["participants"]


def test_signup_rejects_duplicate_participant(client):
    response = client.post("/activities/Chess Club/signup?email=michael@mergington.edu")

    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_unregister_participant_from_activity(client):
    response = client.delete("/activities/Chess Club/unregister?email=michael@mergington.edu")

    assert response.status_code == 200
    assert response.json() == {
        "message": "Unregistered michael@mergington.edu from Chess Club"
    }

    activities_response = client.get("/activities")
    assert "michael@mergington.edu" not in activities_response.json()["Chess Club"]["participants"]
