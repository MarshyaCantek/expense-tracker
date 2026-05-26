const profileInput = document.getElementById("profileInput");
const profilePreview = document.getElementById("profilePreview");

profileInput.addEventListener("change", function () {

  const file = this.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {

    profilePreview.src = e.target.result;

    localStorage.setItem(
      "trackerProfile",
      e.target.result
    );
  };

  reader.readAsDataURL(file);
});

/* LOAD PROFILE */

window.addEventListener("DOMContentLoaded", () => {

  const savedProfile =
    localStorage.getItem("trackerProfile");

  if (savedProfile) {
    profilePreview.src = savedProfile;
  }
});