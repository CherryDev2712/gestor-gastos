// Función para cancelar una orden y volver a la vista inicial
function cancelarOrden() {
    console.log("[EVENTO] cancelarOrden: Cancelando orden actual.");
    resetearVistaOrden();
    mostrarExito("Orden cancelada.");
    console.log("[DEBUG] cancelarOrden: Orden cancelada con éxito.");
}

let ordenes = [];
let ordenActual = null; // Objeto para la orden en curso
let modalTriggerElement = null; // Para devolver el foco después de cerrar un modal

// Helper para obtener la fecha en formato YYYY-MM-DD local
function obtenerFechaLocalISO(date = new Date()) {
    const anio = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

// Función para inicializar la página
function inicializarPagina() {
    console.log("[EVENTO] inicializarPagina: La página se está inicializando.");

    // Activar tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(t => new bootstrap.Tooltip(t));

    // Cargar datos guardados
    cargarOrdenes();

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

// Función para validar y agregar fila
function validarYAgregarFila() {        
    console.log("[EVENTO] validarYAgregarFila: Iniciando validación de gasto.");
    
    if (!ordenActual) {
        mostrarError("Debes iniciar una nueva orden antes de agregar gastos.");
        console.log("[ERROR] validarYAgregarFila: No hay orden actual para agregar gastos.");
        return;
    }

    const conceptoGeneralOrden = document.getElementById('conceptoGastoOrden').value;

    // Validación (lo mismo para todo concepto general)
    const nombreProducto = document.getElementById("nombreProducto").value;
    const precioUnidad = document.getElementById("precioUnidad").value;

    if (!nombreProducto) {
        mostrarError("Debes ingresar un nombre de producto o servicio");
        return;
    }

    if (!precioUnidad || parseFloat(precioUnidad) <= 0) {
        mostrarError("El precio por unidad debe ser mayor a cero");
        return;
    }

    agregarFila();
}

async function agregarFila() {
    if (!ordenActual) {
        mostrarError("Debes iniciar una nueva orden antes de agregar gastos.");
        return;
    }

    const tipoGasto = document.getElementById("tipoGastoOrden")?.value || '';
    const conceptoGasto = document.getElementById("conceptoGastoOrden")?.value || '';
    const establecimiento = document.getElementById("establecimientoOrden")?.value || '';
    const nombreProducto = document.getElementById("nombreProducto").value;

    const gasto = {
        tipoGasto: tipoGasto,
        conceptoGasto: conceptoGasto,
        establecimiento: establecimiento,
        nombreProducto: nombreProducto,
        unidades: parseFloat(document.getElementById("unidades").value),
        medidaUnidad: document.getElementById("medidaUnidad").value,
        precioUnidad: parseFloat(document.getElementById("precioUnidad").value),
        montoTotal: parseFloat(document.getElementById("montoTotal").value),
        fecha: obtenerFechaLocalISO()
    };

ordenActual.gastos.push(gasto);
    agregarFilaATabla(gasto);
    actualizarResumen();
    reiniciarFormulario();
    console.log("[DEBUG] reiniciarFormulario: Formulario reiniciado correctamente.");
mostrarExito("Gasto agregado correctamente");
    console.log("[DEBUG] agregarFila: Gasto agregado correctamente.");
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
    console.log("[DEBUG] agregarFilaATabla: Fila agregada correctamente a la tabla.");
}

// Función para cargar las órdenes guardadas
function cargarOrdenes() {
ordenes = JSON.parse(localStorage.getItem("ordenes")) || [];
    renderizarTablaOrdenes();
    console.log("[DEBUG] cargarOrdenes: Órdenes cargadas correctamente.");
}

// Función para guardar las órdenes en el LocalStorage
function guardarOrdenesLocalStorage() {
localStorage.setItem("ordenes", JSON.stringify(ordenes));
    console.log("[DEBUG] guardarOrdenesLocalStorage: Órdenes guardadas correctamente en LocalStorage.");
}

function limpiarTablaGastosActuales() {
document.getElementById("tablaGastos").innerHTML = "";
    console.log("[DEBUG] limpiarTablaGastosActuales: Tabla de gastos limpiada correctamente.");
}

// Función para eliminar una fila de la tabla y del LocalStorage
function eliminarFila(id, boton) {
    console.log(`[EVENTO] eliminarFila: Intentando eliminar gasto con ID ${id}`);
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
            // Eliminar del array de gastos de la orden actual
            ordenActual.gastos = ordenActual.gastos.filter(gasto => gasto.id !== id);
            boton.closest("tr").remove();
            actualizarResumen();
            console.log(`[ÉXITO] Gasto con ID ${id} eliminado.`);
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

// Función para actualizar el resumen de gastos
function actualizarResumen() {
    console.log("[EVENTO] actualizarResumen: Actualizando todos los resúmenes.");
    
    // --- LÓGICA DE RESUMEN DE ORDEN ACTUAL ---
    let totalOrden = 0;
    let fijosOrden = 0;
    let variablesOrden = 0;
    let deudasOrden = 0;

    if (ordenActual) {
        ordenActual.gastos.forEach(gasto => {
            const monto = parseFloat(gasto.montoTotal);
            totalOrden += monto;
            
            if (gasto.tipoGasto.includes('fijo')) fijosOrden += monto;
            else if (gasto.tipoGasto.includes('variable')) variablesOrden += monto;
            else if (gasto.tipoGasto === 'deuda') deudasOrden += monto;
        });
    }
    
    // Actualizar totales de la orden actual
    const totalGastadoElement = document.getElementById('totalGastado');
    if (totalGastadoElement) {
        totalGastadoElement.textContent = `$${totalOrden.toFixed(2)}`;
    }
    const totalFijosElement = document.getElementById('totalFijos');
    if (totalFijosElement) {
        totalFijosElement.textContent = `$${fijosOrden.toFixed(2)}`;
    }
    const totalVariablesElement = document.getElementById('totalVariables');
    if (totalVariablesElement) {
        totalVariablesElement.textContent = `$${variablesOrden.toFixed(2)}`;
    }
    const totalDeudasElement = document.getElementById('totalDeudas');
    if (totalDeudasElement) {
        totalDeudasElement.textContent = `$${deudasOrden.toFixed(2)}`;
    }

    // NUEVO: Actualizar el input de monto total de la orden
    const montoTotalOrdenDisplay = document.getElementById('montoTotalOrdenDisplay');
    if (montoTotalOrdenDisplay) {
        montoTotalOrdenDisplay.value = totalOrden.toFixed(2);
    }

    // NUEVO: Actualizar el input de total de items
    const totalGastosDisplay = document.getElementById('totalGastosDisplay');
    if (totalGastosDisplay && ordenActual) {
        totalGastosDisplay.value = ordenActual.gastos.length;
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
            ordenActual.gastos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            break;
        case 'monto-asc':
            ordenActual.gastos.sort((a, b) => parseFloat(a.montoTotal) - parseFloat(a.montoTotal));
            break;
        case 'monto-desc':
            ordenActual.gastos.sort((a, b) => parseFloat(b.montoTotal) - parseFloat(a.montoTotal));
            break;
        case 'nombre':
            ordenActual.gastos.sort((a, b) => a.nombreProducto.localeCompare(b.nombreProducto));
            break;
    }
    
    // Reconstruir tabla
    const tabla = document.getElementById("tablaGastos");
    tabla.innerHTML = '';
    
    ordenActual.gastos.forEach((gasto) => {
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
    console.log(`[DEBUG] mostrarExito: ${mensaje}`);
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
                    fecha: fecha || obtenerFechaLocalISO(),
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
    console.log("[DEBUG] agregarTicketATabla: Ticket agregado correctamente a la tabla.");
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
            console.log(`[DEBUG] eliminarTicket: Ticket con ID "+id+" eliminado correctamente."`);
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

function iniciarNuevaOrden() {
    console.log("[EVENTO] iniciarNuevaOrden: Creando estructura para nueva orden.");
    const ahora = new Date();
    ordenActual = {
        id: ahora.getTime(),
        nombre: '',
        fecha: ahora,
        tipoGasto: '',
        conceptoGasto: '',
        establecimiento: '',
        ticket: '', // Aquí puedes poner base64 o URL si tienes input de ticket
        metodoPago: '',
        montoTotalOrden: 0,
        totalGastos: '0',
        gastos: []
    };

    document.getElementById('idOrden').textContent = ordenActual.id;
    document.getElementById('fechaOrden').textContent = obtenerFechaLocalISO(ahora);
    document.getElementById('nombreOrden').value = '';
    // Si tienes inputs para los nuevos campos, inicialízalos aquí también

    document.getElementById('areaDeTrabajo').style.display = 'block';
    document.getElementById('contenedorBtnNuevaOrden').style.display = 'none';

    limpiarTablaGastosActuales();
actualizarResumen();
    console.log("[DEBUG] actualizarResumen: Resumen actualizado correctamente.");
    document.getElementById('nombreOrden').focus();
}

// Cambia la función para agregar gastos a la orden
async function agregarFila() {
    if (!ordenActual) {
        mostrarError("Debes iniciar una nueva orden antes de agregar gastos.");
        return;
    }

    const tipoGasto = document.getElementById("tipoGastoOrden")?.value || '';
    const conceptoGasto = document.getElementById("conceptoGastoOrden")?.value || '';
    const establecimiento = document.getElementById("establecimientoOrden")?.value || '';
    const nombreProducto = document.getElementById("nombreProducto").value;

    const gasto = {
        tipoGasto: tipoGasto,
        conceptoGasto: conceptoGasto,
        establecimiento: establecimiento,
        nombreProducto: nombreProducto,
        unidades: parseFloat(document.getElementById("unidades").value),
        medidaUnidad: document.getElementById("medidaUnidad").value,
        precioUnidad: parseFloat(document.getElementById("precioUnidad").value),
        montoTotal: parseFloat(document.getElementById("montoTotal").value),
        fecha: obtenerFechaLocalISO()
    };

ordenActual.gastos.push(gasto);
    agregarFilaATabla(gasto);
    actualizarResumen();
    reiniciarFormulario();
    mostrarExito("Gasto agregado correctamente");
    console.log("[DEBUG] agregarFila: Gasto agregado correctamente.");
}

// Al finalizar la orden, copia los datos generales y calcula totales
function finalizarOrden() {
    console.log("[EVENTO] finalizarOrden: Validando y guardando la orden actual.");
    const nombre = document.getElementById('nombreOrden').value.trim();
    if (!nombre) {
        mostrarError("Por favor, ingresa el nombre de la persona para la orden.");
        return;
    }
    if (ordenActual.gastos.length === 0) {
        mostrarError("La orden está vacía. Agrega al menos un gasto.");
        return;
    }

    ordenActual.nombre = nombre;
    ordenActual.tipoGasto = document.getElementById('tipoGastoOrden')?.value || '';
    ordenActual.conceptoGasto = document.getElementById('conceptoGastoOrden')?.value || '';
    ordenActual.establecimiento = document.getElementById('establecimientoOrden')?.value || '';
    ordenActual.ticket = document.getElementById('ticketOrden')?.value || '';
    ordenActual.metodoPago = document.getElementById('metodoPagoOrden')?.value || '';
    ordenActual.montoTotalOrden = ordenActual.gastos.reduce((sum, g) => sum + (g.montoTotal || 0), 0);
    ordenActual.totalGastos = ordenActual.gastos.length.toString();

ordenes.push(ordenActual);
    guardarOrdenesLocalStorage();

    renderizarTablaOrdenes();

    mostrarExito(`Orden a nombre de '${nombre}' guardada correctamente.`);
    console.log("[DEBUG] finalizarOrden: Orden finalizada y guardada correctamente.");
    resetearVistaOrden();
}

// Cambia el renderizado de detalles para mostrar la nueva estructura de gasto
function verDetallesOrden(id) {
    console.log(`[EVENTO] verDetallesOrden: Mostrando detalles para la orden ID ${id}`);
    const orden = ordenes.find(o => o.id == id);

    if (!orden) {
        console.error(`No se encontró la orden con ID ${id}`);
        mostrarError("No se pudo encontrar la orden seleccionada.");
        return;
    }

    document.getElementById('modalDetallesOrdenLabel').textContent = `Detalles de la Orden #${orden.id}`;
    document.getElementById('detalleOrdenId').textContent = orden.id;
    document.getElementById('detalleOrdenNombre').textContent = orden.nombre;
    document.getElementById('detalleOrdenFecha').textContent = obtenerFechaLocalISO(new Date(orden.fecha));

    // NUEVO: llenar los inputs de monto total y total de items
    const inputMontoTotalModal = document.getElementById('montoTotalOrdenDisplayModal');
    if (inputMontoTotalModal) {
        // Suma todos los montoTotal de los gastos
        const total = orden.gastos.reduce((sum, g) => sum + (parseFloat(g.montoTotal) || 0), 0);
        inputMontoTotalModal.value = total.toFixed(2);
    }
    const inputTotalItemsModal = document.getElementById('totalGastosDisplayModal');
    if (inputTotalItemsModal) {
        inputTotalItemsModal.value = orden.gastos.length;
    }

    const cuerpoTabla = document.getElementById('cuerpoTablaDetallesOrden');
    cuerpoTabla.innerHTML = '';

    if (orden.gastos.length === 0) {
        cuerpoTabla.innerHTML = '<tr><td colspan="6" class="text-center">Esta orden no tiene gastos registrados.</td></tr>';
    } else {
        orden.gastos.forEach(gasto => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${gasto.tipoGasto || ''}</td>
                <td>${gasto.conceptoGasto || ''}</td>
                <td>${gasto.establecimiento || ''}</td>
                <td>${gasto.nombreProducto || ''}</td>
                <td>${gasto.unidades || ''}</td>
                <td>${gasto.medidaUnidad || ''}</td>
                <td>$${parseFloat(gasto.precioUnidad || 0).toFixed(2)}</td>
                <td>$${parseFloat(gasto.montoTotal || 0).toFixed(2)}</td>
            `;
            cuerpoTabla.appendChild(fila);
        });
    }

    const modal = new bootstrap.Modal(document.getElementById('modalDetallesOrden'));
modal.show();
    console.log("[DEBUG] verDetallesOrden: Detalles de la orden mostrados correctamente.");
}

// Función para renderizar la tabla de órdenes
function renderizarTablaOrdenes() {
    const cuerpoTabla = document.getElementById('cuerpoTablaOrdenes');
    if (!cuerpoTabla) return;

    cuerpoTabla.innerHTML = '';
    if (ordenes.length === 0) {
        cuerpoTabla.innerHTML = '<tr><td colspan="6" class="text-center">No hay órdenes registradas.</td></tr>';
        return;
    }

    ordenes.forEach(orden => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${orden.id}</td>
            <td>${orden.nombre}</td>
            <td>${obtenerFechaLocalISO(new Date(orden.fecha))}</td>
            <td>$${parseFloat(orden.montoTotalOrden || 0).toFixed(2)}</td>
            <td>${orden.totalGastos || orden.gastos.length}</td>
            <td>
                <button class="btn btn-info btn-sm" onclick="verDetallesOrden('${orden.id}')">
                    <i class="bi bi-eye"></i> Ver
                </button>
            </td>
        `;
        cuerpoTabla.appendChild(fila);
    });
}

// Inicializar la página cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log("[DEBUG] DOMContentLoaded se ha disparado.");
    inicializarPagina();
    console.log("[DEBUG] Intentando configurar event listeners para botones de orden.");
    document.getElementById('btnNuevaOrden').addEventListener('click', () => { console.log("[EVENTO] Clic en 'Crear Nueva Orden'"); iniciarNuevaOrden(); });
    document.getElementById('btnFinalizarOrden').addEventListener('click', () => { console.log("[EVENTO] Clic en 'Finalizar Orden'"); finalizarOrden(); });
    document.getElementById('btnCancelarOrden').addEventListener('click', () => { console.log("[EVENTO] Clic en 'Cancelar Orden'"); cancelarOrden(); });
});

function resetearVistaOrden() {
    // Oculta el área de trabajo y muestra el botón para nueva orden
    document.getElementById('areaDeTrabajo').style.display = 'none';
    document.getElementById('contenedorBtnNuevaOrden').style.display = 'block';
    limpiarTablaGastosActuales();
ordenActual = null;
    console.log("[DEBUG] resetearVistaOrden: Vista de la orden reseteada correctamente.");
}
