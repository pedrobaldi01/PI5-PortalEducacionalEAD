document.addEventListener("DOMContentLoaded", () => {
  configurarFormulariosDemo();
});

function configurarFormulariosDemo() {
  const forms = document.querySelectorAll("form");

  forms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      alert("Ação simulada. Esta tela ainda precisa ser conectada ao backend.");
    });
  });
}
