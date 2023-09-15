const EnumToast = Object.freeze({
    primario: 'bg-primary',
    secundario: 'bg-secondary',
    sucesso: 'bg-success',
    erro: 'bg-danger',
    alerta: 'bg-warning',
    informacao: 'bg-info',
    dark: 'bg-dark'
});

let oldTipo;

function toast(titulo, msg, tipo, delay= 3000) {
    let toastExample = document.querySelector('.toast-ex'),
        toastTitulo = document.querySelector('.toast-titulo'),
        toastMsg = document.querySelector('.toast-msg');

    toastExample.classList.remove(oldTipo, 'animate__zoomInDown');

    toastTitulo.innerHTML = titulo;
    toastMsg.innerHTML = msg;

    toastExample.classList.add(tipo, 'animate__zoomInDown');
    toastExample.setAttribute('data-bs-delay', delay.toString())
    oldTipo = tipo;

    new bootstrap.Toast(toastExample).show();
}