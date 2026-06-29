from fastapi.testclient import TestClient

from src.app import app


def test_unregister_participant_from_activity():
    client = TestClient(app)

    response = client.delete('/activities/Chess Club/unregister?email=michael@mergington.edu')

    assert response.status_code == 200
    assert response.json()['message'] == 'Unregistered michael@mergington.edu from Chess Club'

    activities_response = client.get('/activities')
    chess_club = activities_response.json()['Chess Club']
    assert 'michael@mergington.edu' not in chess_club['participants']
