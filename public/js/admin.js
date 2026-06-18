document.addEventListener("DOMContentLoaded", () => {
  const autorizado = window.Session?.protegerPagina?.(["administrador", "admin", "coordenador"]);

  if (!autorizado) {
    return;
  }

  configurarFormulariosAdministrativos();
});

function configurarFormulariosAdministrativos() {
  const formularios = document.querySelectorAll("form");

  formularios.forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      window.UI?.mostrarInfo?.("Formulário pronto para integração com o backend nas próximas sprints.");
    });
  });
}
