// Variables globales
let presupuestoMensual = 50; // Puedes hacer esto editable
let gastos = [];
let ticketsGuardados = [];

// Función para inicializar la página
function inicializarPagina() {
    // Establecer fecha actual por defecto
    document.getElementById('fechaGasto').valueAsDate = new Date();
    document.getElementById('fechaGastoImagen').valueAsDate = new Date();
    
    // Activar tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(t => new bootstrap.Tooltip(t));
    
    // Configurar botón de guardar ticket
    const btnGuardarTicket = document.getElementById('btnGuardarTicket');
    if (btnGuardarTicket) {
        btnGuardarTicket.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Botón Guardar Ticket clickeado");
            guardarTicket();
        });
    } else {
        console.error("El botón btnGuardarTicket no fue encontrado");
    }
    
    // Cargar datos guardados
    cargarDatos();
    cargarTickets();
    
    // Actualizar resumen
    actualizarResumen();
}

// Función para calcular el monto total automáticamente
function calcularMontoTotal() {
    const unidades = parseFloat(document.getElementById("unidades").value) || 0;
    const precioUnidad = parseFloat(document.getElementById("precioUnidad").value) || 0;
    const montoTotal = unidades * precioUnidad;
    document.getElementById("montoTotal").value = montoTotal.toFixed(2);
}

// Función para guardar los campos en el LocalStorage
function guardarCampos() {
    const tipoGasto = document.getElementById("tipoGasto").value;
    const conceptoGasto = document.getElementById("conceptoGasto").value;
    const establecimiento = document.getElementById("establecimiento").value;
    localStorage.setItem('tipoGasto', tipoGasto);
    localStorage.setItem('conceptoGasto', conceptoGasto);
    localStorage.setItem('establecimiento', establecimiento);
}

// Función para cargar los datos guardados en LocalStorage
function cargarCampos() {
    const tipoGasto = localStorage.getItem('tipoGasto');
    const conceptoGasto = localStorage.getItem('conceptoGasto');
    const establecimiento = localStorage.getItem('establecimiento');

    if (tipoGasto) document.getElementById('tipoGasto').value = tipoGasto;
    if (conceptoGasto) document.getElementById('conceptoGasto').value = conceptoGasto;
    if (establecimiento) document.getElementById('establecimiento').value = establecimiento;
}

// Función para validar y agregar fila
function validarYAgregarFila() {        
    const nombreProducto = document.getElementById("nombreProducto").value;
    const precioUnidad = document.getElementById("precioUnidad").value;
    
    if (!nombreProducto) {
        mostrarError("Debes ingresar un nombre de producto");
        return;
    }
    
    if (!precioUnidad || parseFloat(precioUnidad) <= 0) {
        mostrarError("El precio por unidad debe ser mayor a cero");
        return;
    }
    
    agregarFila();
}

async function agregarFila() {
    const gasto = {
        id: Date.now().toString(),
        tipoGasto: document.getElementById("tipoGasto").value,
        conceptoGasto: document.getElementById("conceptoGasto").value,
        establecimiento: document.getElementById("establecimiento").value,
        nombreProducto: document.getElementById("nombreProducto").value,
        unidades: document.getElementById("unidades").value,
        medidaUnidad: document.getElementById("medidaUnidad").value,
        precioUnidad: document.getElementById("precioUnidad").value,
        montoTotal: document.getElementById("montoTotal").value,
        fecha: document.getElementById("fechaGasto").value || new Date().toISOString().split('T')[0],
    };

    agregarFilaATabla(gasto);
    gastos.push(gasto);
    guardarDatosLocalStorage(gastos);
    actualizarResumen();
    reiniciarFormulario();
    mostrarExito("Gasto agregado correctamente");
}

function agregarFilaATabla(gasto) {
    const tabla = document.getElementById("tablaGastos");
    const fila = document.createElement("tr");
    
    let badgeClass = '';
    if (gasto.tipoGasto.includes('fijo')) badgeClass = 'badge-fijo';
    else if (gasto.tipoGasto.includes('variable')) badgeClass = 'badge-variable';
    else if (gasto.tipoGasto === 'deuda') badgeClass = 'badge-deuda';
    
    fila.innerHTML = `
        <td><span class="badge ${badgeClass}">${gasto.tipoGasto}</span></td>
        <td>${gasto.conceptoGasto}</td>
        <td>${gasto.establecimiento}</td>
        <td>${gasto.nombreProducto}</td>
        <td>${gasto.unidades}</td>
        <td>${gasto.medidaUnidad}</td>
        <td>$${parseFloat(gasto.precioUnidad).toFixed(2)}</td>
        <td>$${parseFloat(gasto.montoTotal).toFixed(2)}</td>
        <td>${gasto.fecha}</td>
        <td>
            <button class="btn btn-danger btn-sm" onclick="eliminarFila('${gasto.id}', this)">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;
    tabla.appendChild(fila);
}

// Función para cargar los datos de la tabla desde el LocalStorage
function cargarDatos() {
    cargarCampos();
    gastos = obtenerDatosLocalStorage();
    
    const tabla = document.getElementById("tablaGastos");
    tabla.innerHTML = '';
    
    gastos.forEach((gasto) => {
        agregarFilaATabla(gasto);
    });
    
    // Ordenar por fecha más reciente por defecto
    ordenarTabla();
}

// Función para obtener los datos del LocalStorage
function obtenerDatosLocalStorage() {
    return JSON.parse(localStorage.getItem("gastos")) || [];
}

// Función para guardar los datos en el LocalStorage
function guardarDatosLocalStorage(datos) {
    localStorage.setItem("gastos", JSON.stringify(datos));
}

// Función para eliminar una fila de la tabla y del LocalStorage
function eliminarFila(id, boton) {
    Swal.fire({
        title: '¿Eliminar gasto?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: 'var(--card-bg)'
    }).then((result) => {
        if (result.isConfirmed) {
            gastos = gastos.filter(gasto => gasto.id !== id);
            guardarDatosLocalStorage(gastos);
            boton.closest("tr").remove();
            actualizarResumen();
            mostrarExito("Gasto eliminado correctamente");
        }
    });
}

// Función para reiniciar el formulario
function reiniciarFormulario() {
    document.getElementById("nombreProducto").value = "";
    document.getElementById("unidades").value = "1";
    document.getElementById("medidaUnidad").value = "";
    document.getElementById("precioUnidad").value = "";
    document.getElementById("montoTotal").value = "";
    document.getElementById("nombreProducto").focus();
}

// Función para confirmar y reiniciar la tabla y el formulario
function confirmarReinicioTabla() {
    Swal.fire({
        title: '¿Reiniciar tabla?',
        text: "Se eliminarán todos los gastos registrados",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, reiniciar',
        cancelButtonText: 'Cancelar',
        background: 'var(--card-bg)'
    }).then((result) => {
        if (result.isConfirmed) {
            reiniciarTabla();
            reiniciarFormulario();
            mostrarExito("Tabla reiniciada correctamente");
        }
    });
}

// Función para reiniciar la tabla y el LocalStorage
function reiniciarTabla() {
    localStorage.removeItem("gastos");
    document.getElementById("tablaGastos").innerHTML = "";
    gastos = [];
    actualizarResumen();
}

// Función para enviar la tabla (simulado with una alerta)
function enviarTabla() {
    if (gastos.length === 0) {
        mostrarError("No hay datos en la tabla para enviar");
        return;
    }
    
    // Aquí iría la lógica para enviar los datos al servidor
    console.log("Datos a enviar:", gastos);
    
    // Simulación de envío exitoso
    setTimeout(() => {
        mostrarExito("Gastos guardados correctamente en el sistema");
    }, 1000);
}

// Función para actualizar el resumen de gastos
function actualizarResumen() {
    let total = 0;
    let fijos = 0;
    let variables = 0;
    let deudas = 0;
    
    gastos.forEach(gasto => {
        const monto = parseFloat(gasto.montoTotal);
        total += monto;
        
        if (gasto.tipoGasto.includes('fijo')) fijos += monto;
        else if (gasto.tipoGasto.includes('variable')) variables += monto;
        else if (gasto.tipoGasto === 'deuda') deudas += monto;
    });
    
    // Actualizar totales
    document.getElementById('totalGastado').textContent = `$${total.toFixed(2)}`;
    document.getElementById('totalFijos').textContent = `$${fijos.toFixed(2)}`;
    document.getElementById('totalVariables').textContent = `$${variables.toFixed(2)}`;
    document.getElementById('totalDeudas').textContent = `$${deudas.toFixed(2)}`;
    
    // Actualizar barra de progreso
    const porcentaje = Math.min((total / presupuestoMensual) * 100, 100);
    document.getElementById('progressBar').style.width = `${porcentaje}%`;
    document.getElementById('gastadoPresupuesto').textContent = `$${total.toFixed(2)}`;
    document.getElementById('disponiblePresupuesto').textContent = `$${Math.max(presupuestoMensual - total, 0).toFixed(2)}`;
    
    // Cambiar color de la barra según el porcentaje
    const progressBar = document.getElementById('progressBar');
    progressBar.classList.remove('bg-success', 'bg-warning', 'bg-danger');
    
    if (porcentaje < 50) {
        progressBar.classList.add('bg-success');
    } else if (porcentaje < 80) {
        progressBar.classList.add('bg-warning');
    } else {
        progressBar.classList.add('bg-danger');
    }
}

// Función para filtrar la tabla
function filtrarTabla() {
    const filtro = document.getElementById('buscarGasto').value.toLowerCase();
    const tipoFiltro = document.getElementById('filtroTipo').value;
    
    const filas = document.querySelectorAll('#tablaGastos tr');
    
    filas.forEach(fila => {
        const nombre = fila.cells[3].textContent.toLowerCase();
        const establecimiento = fila.cells[2].textContent.toLowerCase();
        const tipo = fila.cells[0].textContent.toLowerCase();
        
        const coincideTexto = nombre.includes(filtro) || establecimiento.includes(filtro);
        const coincideTipo = !tipoFiltro || tipo.includes(tipoFiltro.toLowerCase());
        
        fila.style.display = (coincideTexto && coincideTipo) ? '' : 'none';
    });
}

// Función para ordenar la tabla
function ordenarTabla() {
    const criterio = document.getElementById('ordenarPor').value;
    
    switch(criterio) {
        case 'fecha':
            gastos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            break;
        case 'monto-asc':
            gastos.sort((a, b) => parseFloat(a.montoTotal) - parseFloat(b.montoTotal));
            break;
        case 'monto-desc':
            gastos.sort((a, b) => parseFloat(b.montoTotal) - parseFloat(a.montoTotal));
            break;
        case 'nombre':
            gastos.sort((a, b) => a.nombreProducto.localeCompare(b.nombreProducto));
            break;
    }
    
    // Reconstruir tabla
    const tabla = document.getElementById("tablaGastos");
    tabla.innerHTML = '';
    
    gastos.forEach((gasto) => {
        agregarFilaATabla(gasto);
    });
}

// Función para cambiar entre tema claro/oscuro
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-bs-theme', newTheme);
    
    // Cambiar icono
    const themeIcon = document.querySelector('[onclick="toggleTheme()"] i');
    themeIcon.classList.toggle('bi-moon-stars');
    themeIcon.classList.toggle('bi-sun');
    
    // Guardar preferencia
    localStorage.setItem('theme', newTheme);
}

// Función para mostrar errores con SweetAlert2
function mostrarError(mensaje) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje,
        background: 'var(--card-bg)'
    });
}

// Función para mostrar éxitos con SweetAlert2
function mostrarExito(mensaje) {
    Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: mensaje,
        showConfirmButton: false,
        timer: 1500,
        background: 'var(--card-bg)'
    });
}

// Funciones para manejar tickets
function cargarTickets() {
    ticketsGuardados = JSON.parse(localStorage.getItem('ticketsGuardados')) || [];
    const ticketsPreview = document.getElementById('ticketsPreview');
    ticketsPreview.innerHTML = '';
    
    ticketsGuardados.forEach((ticket) => {
        agregarTicketATabla(ticket);
    });
}

function guardarTicket() {
    try {
        console.log("[DEBUG] Iniciando guardarTicket");
        
        // Obtener elementos con verificación
        const imagenInput = document.getElementById('imagenTicketInput');
        const conceptoSelect = document.getElementById('conceptoGastoImagen');
        const tipoSelect = document.getElementById('tipoGastoImagen');
        const establecimientoInput = document.getElementById('establecimientoImagen');
        const fechaInput = document.getElementById('fechaGastoImagen');
        
        // Validar que todos los elementos existen
        if (!imagenInput || !conceptoSelect || !tipoSelect || !establecimientoInput || !fechaInput) {
            throw new Error("Algunos elementos del formulario no fueron encontrados");
        }
        
        // Obtener valores
        const tipoGasto = tipoSelect.value;
        const conceptoGasto = conceptoSelect.value;
        const establecimiento = establecimientoInput.value.trim();
        const fecha = fechaInput.value;
        const archivoImagen = imagenInput.files[0];
        
        console.log("[DEBUG] Valores obtenidos:", {
            tipoGasto, 
            conceptoGasto, 
            establecimiento, 
            fecha,
            archivoImagen: archivoImagen ? archivoImagen.name : "Ninguno"
        });
        
        // Validaciones
        if (!archivoImagen) {
            throw new Error("Por favor selecciona una imagen del ticket.");
        }
        
        if (!conceptoGasto || conceptoGasto === "Seleccione...") {
            throw new Error("Por favor selecciona un concepto de gasto válido.");
        }
        
        if (!establecimiento) {
            throw new Error("Por favor ingresa un establecimiento.");
        }
        
        // Leer imagen
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                console.log("[DEBUG] Imagen leída correctamente");
                
                const ticket = {
                    id: Date.now().toString(),
                    tipo: tipoGasto,
                    concepto: conceptoGasto,
                    establecimiento: establecimiento,
                    fecha: fecha || new Date().toISOString().split('T')[0],
                    imagen: e.target.result
                };
                
                console.log("[DEBUG] Ticket a guardar:", ticket);
                
                // Agregar a la lista y guardar
                ticketsGuardados.push(ticket);
                localStorage.setItem('ticketsGuardados', JSON.stringify(ticketsGuardados));
                
                // Actualizar UI
                agregarTicketATabla(ticket);
                mostrarExito("Ticket guardado correctamente");
                
                // Limpiar formulario
                conceptoSelect.value = '';
                establecimientoInput.value = '';
                imagenInput.value = '';
                
            } catch (error) {
                console.error("[ERROR] En onload:", error);
                mostrarError("Error al procesar el ticket: " + error.message);
            }
        };
        
        reader.onerror = function() {
            throw new Error("Error al leer la imagen. Por favor intenta con otra.");
        };
        
        reader.readAsDataURL(archivoImagen);
        
    } catch (error) {
        console.error("[ERROR] En guardarTicket:", error);
        mostrarError(error.message);
    }
}

function agregarTicketATabla(ticket) {
    const ticketsPreview = document.getElementById('ticketsPreview');
    const newRow = document.createElement('tr');
    
    // Columnas de datos
    newRow.innerHTML = `
        <td>${ticket.tipo}</td>
        <td>${ticket.concepto}</td>
        <td>${ticket.establecimiento}</td>
        <td>${ticket.fecha}</td>
        <td>
            <button class="btn btn-primary btn-sm btn-ver-ticket" 
                    data-imagen="${ticket.imagen}"
                    data-bs-toggle="modal" 
                    data-bs-target="#modalTicket">
                <i class="bi bi-eye"></i> Ver Ticket
            </button>
        </td>
        <td>
            <button class="btn btn-danger btn-sm" onclick="eliminarTicket('${ticket.id}')">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;
    
    ticketsPreview.appendChild(newRow);
}

function eliminarTicket(id) {
    Swal.fire({
        title: '¿Eliminar ticket?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: 'var(--card-bg)'
    }).then((result) => {
        if (result.isConfirmed) {
            ticketsGuardados = ticketsGuardados.filter(ticket => ticket.id !== id);
            localStorage.setItem('ticketsGuardados', JSON.stringify(ticketsGuardados));
            cargarTickets();
            mostrarExito("Ticket eliminado correctamente");
        }
    });
}

// Evento para mostrar la imagen en el modal
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-ver-ticket')) {
        const imagenSrc = e.target.getAttribute('data-imagen');
        document.getElementById('imagenModal').src = imagenSrc;
    }
});

// Presupuesto editable
function cargarPresupuesto() {
    const guardado = localStorage.getItem('presupuestoMensual');
    if (guardado !== null) {
        presupuestoMensual = parseFloat(guardado);
    }
}

function guardarPresupuesto(nuevo) {
    presupuestoMensual = nuevo;
    localStorage.setItem('presupuestoMensual', nuevo);
    actualizarResumen();
}

// Evento para abrir el modal y mostrar el valor actual
document.getElementById('btnEditarPresupuesto').addEventListener('click', function() {
    document.getElementById('inputPresupuesto').value = presupuestoMensual;
});

// Evento para guardar el presupuesto
document.getElementById('guardarPresupuestoBtn').addEventListener('click', function() {
    const valor = parseFloat(document.getElementById('inputPresupuesto').value);
    if (isNaN(valor) || valor <= 0) {
        mostrarError('Por favor ingresa un presupuesto válido.');
        return;
    }
    guardarPresupuesto(valor);
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalPresupuesto'));
    modal.hide();
    mostrarExito('Presupuesto actualizado');
});

// Al cargar la página, cargar el presupuesto guardado
document.addEventListener("DOMContentLoaded", function() {
    cargarPresupuesto();
    inicializarPagina();
});