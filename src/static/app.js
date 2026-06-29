document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let activitiesData = {};

  function renderActivities(activities) {
    activitiesData = activities;

    // Clear loading message and previous options
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    // Populate activities list
    Object.entries(activities).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;
      const participantMarkup = details.participants.length > 0
        ? `
          <div class="participants-section">
            <strong>Participants:</strong>
            <div class="participants-list">
              ${details.participants.map((participant) => `
                <div class="participant-row">
                  <span>${participant}</span>
                  <button type="button" class="remove-participant-btn" data-activity="${name}" data-email="${participant}" aria-label="Remove ${participant}">
                    ✕
                  </button>
                </div>
              `).join("")}
            </div>
          </div>
        `
        : `
          <div class="participants-section">
            <strong>Participants:</strong>
            <p class="participants-empty">No participants yet. Be the first to sign up!</p>
          </div>
        `;

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        ${participantMarkup}
      `;

      activitiesList.appendChild(activityCard);

      // Add option to select dropdown
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });

    document.querySelectorAll(".remove-participant-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const activityName = button.dataset.activity;
        const email = button.dataset.email;

        try {
          const response = await fetch(`/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`, {
            method: "DELETE",
          });

          const result = await response.json();

          if (response.ok) {
            const activity = activitiesData[activityName];
            if (activity) {
              activity.participants = activity.participants.filter((participant) => participant !== email);
              renderActivities(activitiesData);
            } else {
              await fetchActivities();
            }

            messageDiv.textContent = result.message;
            messageDiv.className = "message success";
          } else {
            messageDiv.textContent = result.detail || "An error occurred";
            messageDiv.className = "message error";
          }

          messageDiv.classList.remove("hidden");
          setTimeout(() => {
            messageDiv.classList.add("hidden");
          }, 5000);
        } catch (error) {
          messageDiv.textContent = "Failed to unregister participant. Please try again.";
          messageDiv.className = "message error";
          messageDiv.classList.remove("hidden");
          console.error("Error unregistering participant:", error);
        }
      });
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      renderActivities(activities);
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        const activityData = activitiesData[activity];
        if (activityData) {
          activityData.participants = [...activityData.participants, email];
          renderActivities(activitiesData);
        } else {
          await fetchActivities();
        }

        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
