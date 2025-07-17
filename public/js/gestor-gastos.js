// Variables globales
let presupuesto = {
    monto: 0,
    periodo: 'mensual' // Opciones: diario, semanal, mensual, anual
};
let ordenes = [];
let alertaPresupuestoMostrada = false;
let ordenActual = null; // Objeto para la orden en curso
let ticketsGuardados = [];
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
            e.preventDefault(); // Prevenir el comportamiento por defecto del botón
            console.log("Botón Guardar Ticket clickeado");
            guardarTicket();
        });
    } else {
        console.error("El botón btnGuardarTicket no fue encontrado");
    }
    
    // Configurar botones de orden
    document.getElementById('btnNuevaOrden').addEventListener('click', () => { console.log("[EVENTO] Clic en 'Crear Nueva Orden'"); iniciarNuevaOrden(); });
    document.getElementById('btnFinalizarOrden').addEventListener('click', () => { console.log("[EVENTO] Clic en 'Finalizar Orden'"); finalizarOrden(); });
    document.getElementById('btnCancelarOrden').addEventListener('click', () => { console.log("[EVENTO] Clic en 'Cancelar Orden'"); cancelarOrden(); });

    // Cargar datos guardados
    cargarPresupuesto();
    cargarOrdenes();
    cargarTickets();
    
    // NOTA: El resumen y la tabla de gastos ahora se actualizan
    // solo cuando hay una orden activa.
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
    const categoria = document.getElementById('categoriaGasto').value;
    if (categoria === 'servicio') {
        // Validación para servicio
        const tipoGasto = document.getElementById("tipoGasto").value;
        const establecimiento = document.getElementById("establecimiento").value;
        const montoDeuda = document.getElementById("montoDeuda").value;
        const fechaGasto = document.getElementById("fechaGasto").value;

        if (!tipoGasto) {
            mostrarError("Selecciona el tipo de gasto");
            return;
        }
        if (!establecimiento) {
            mostrarError("Debes ingresar el establecimiento del servicio");
            return;
        }
        if (!montoDeuda || parseFloat(montoDeuda) <= 0) {
            mostrarError("El monto de la deuda debe ser mayor a cero");
            return;
        }
        if (!fechaGasto) {
            mostrarError("Debes ingresar la fecha del servicio");
            return;
        }

        const gasto = {
            id: Date.now().toString(),
            tipoGasto: tipoGasto,
            conceptoGasto: "servicio",
            establecimiento: establecimiento,
            nombreProducto: "Servicio",
            unidades: "",
            medidaUnidad: "",
            precioUnidad: "",
            montoTotal: montoDeuda,
            fecha: fechaGasto,
        };

        agregarFilaATabla(gasto);
        ordenActual.gastos.push(gasto);
        actualizarResumen();
        // Limpiar campos de servicio
        document.getElementById("montoDeuda").value = "";
        mostrarExito("Servicio agregado correctamente");
    } else {
        // Validación original para comida/insumo
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
}

async function agregarFila() {
    const gasto = {
        id: Date.now().toString(),
        tipoGasto: document.getElementById("tipoGasto").value,
        conceptoGasto: document.getElementById("categoriaGasto").value,
        establecimiento: document.getElementById("establecimiento").value,
        nombreProducto: document.getElementById("nombreProducto").value,
        unidades: document.getElementById("unidades").value,
        medidaUnidad: document.getElementById("medidaUnidad").value,
        precioUnidad: document.getElementById("precioUnidad").value,
        montoTotal: document.getElementById("montoTotal").value,
        fecha: document.getElementById("fechaGasto").value || obtenerFechaLocalISO(),
    };

    agregarFilaATabla(gasto);
    ordenActual.gastos.push(gasto);
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

// Función para cargar las órdenes guardadas
function cargarOrdenes() {
    ordenes = JSON.parse(localStorage.getItem("ordenes")) || [];
    // Por ahora, solo las cargamos en memoria.
    // En un futuro, aquí se podría poblar una tabla de órdenes.
    renderizarTablaOrdenes();
}

// Función para guardar las órdenes en el LocalStorage
function guardarOrdenesLocalStorage() {
    localStorage.setItem("ordenes", JSON.stringify(ordenes));
}

function limpiarTablaGastosActuales() {
    document.getElementById("tablaGastos").innerHTML = "";
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
    console.log("[EVENTO] actualizarResumen: Actualizando todos los resúmenes y la barra de progreso.");
    
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

    // --- LÓGICA DE LA BARRA DE PROGRESO ---
    // 1. Recolectar todos los gastos de todas las órdenes guardadas
    const todosLosGastos = ordenes.flatMap(orden => orden.gastos);

    // 2. Filtrar gastos según el período del presupuesto
    const hoy = new Date();
    const gastosDelPeriodo = todosLosGastos.filter(gasto => {
        const fechaGasto = new Date(gasto.fecha + 'T00:00:00'); // Asegurar que la hora no afecte
        switch (presupuesto.periodo) {
            case 'diario':
                return fechaGasto.toDateString() === hoy.toDateString();
            case 'semanal':
                const inicioSemana = new Date(hoy);
                inicioSemana.setDate(hoy.getDate() - hoy.getDay());
                inicioSemana.setHours(0, 0, 0, 0);
                const finSemana = new Date(inicioSemana);
                finSemana.setDate(inicioSemana.getDate() + 6);
                finSemana.setHours(23, 59, 59, 999);
                return fechaGasto >= inicioSemana && fechaGasto <= finSemana;
            case 'mensual':
                return fechaGasto.getMonth() === hoy.getMonth() && fechaGasto.getFullYear() === hoy.getFullYear();
            case 'anual':
                return fechaGasto.getFullYear() === hoy.getFullYear();
            default:
                return true;
        }
    });

    const totalGastadoEnPeriodo = gastosDelPeriodo.reduce((sum, gasto) => sum + parseFloat(gasto.montoTotal), 0);

    // 3. Actualizar la UI del presupuesto
    const disponible = presupuesto.monto - totalGastadoEnPeriodo;
    const sobregiroContainer = document.getElementById('sobregiroPresupuestoContainer');
    const sobregiroValor = document.getElementById('sobregiroPresupuesto');
    const periodoLabel = document.getElementById('periodoPresupuestoLabel');
    
    if (periodoLabel) {
 periodoLabel.textContent = presupuesto.periodo.charAt(0).toUpperCase() + presupuesto.periodo.slice(1);
    }

    if (disponible >= 0) {
        // Aún hay presupuesto
        const disponiblePresupuestoElement = document.getElementById('disponiblePresupuesto');
 if (disponiblePresupuestoElement) {
 disponiblePresupuestoElement.textContent = `$${disponible.toFixed(2)}`;
        }
 if (sobregiroContainer) {
 sobregiroContainer.style.display = 'none';
        }
    } else {
        // Se ha excedido el presupuesto
        const disponiblePresupuestoElement = document.getElementById('disponiblePresupuesto');
 if (disponiblePresupuestoElement) disponiblePresupuestoElement.textContent = `$0.00`;
 if (sobregiroValor) sobregiroValor.textContent = `$${Math.abs(disponible).toFixed(2)}`;
 if (sobregiroContainer) sobregiroContainer.style.display = 'block';

        if (!alertaPresupuestoMostrada && presupuesto.monto > 0) {
            console.log("[ALERTA] Presupuesto excedido.");
            Swal.fire({
                icon: 'warning',
                title: '¡Presupuesto Excedido!',
                text: 'Has gastado más de lo que presupuestaste para este mes.',
                background: 'var(--card-bg)'
            });
            alertaPresupuestoMostrada = true;
        }
    }

    const porcentaje = presupuesto.monto > 0 ? Math.min((totalGastadoEnPeriodo / presupuesto.monto) * 100, 100) : 0;
    const progressBarElement = document.getElementById('progressBar');
    if (progressBarElement) {
 progressBarElement.style.width = `${porcentaje}%`;
    }
    
    const gastadoPresupuestoElement = document.getElementById('gastadoPresupuesto');
    if (gastadoPresupuestoElement) {
 gastadoPresupuestoElement.textContent = `$${totalGastadoEnPeriodo.toFixed(2)}`;
    }
    
    // Cambiar color de la barra según el porcentaje
    if (progressBarElement) {
 progressBarElement.classList.remove('bg-success', 'bg-warning', 'bg-danger');
    if (porcentaje < 50) {
        progressBar.classList.add('bg-success');
    } else if (porcentaje < 80) {
        progressBar.classList.add('bg-warning');
    } else {
        progressBar.classList.add('bg-danger');
    }
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
    console.log("[EVENTO] cargarPresupuesto: Cargando presupuesto desde localStorage.");
    presupuesto = JSON.parse(localStorage.getItem('presupuesto')) || { monto: 0, periodo: 'mensual' };
    console.log("[INFO] Presupuesto cargado/inicializado:", presupuesto);
}

function guardarPresupuesto() {
    const nuevoMonto = parseFloat(document.getElementById('inputPresupuesto').value);
    const nuevoPeriodo = document.getElementById('selectPeriodoPresupuesto').value;
    
    if (isNaN(nuevoMonto) || nuevoMonto <= 0) {
        mostrarError('Por favor ingresa un presupuesto válido y mayor a cero.');
        return;
    }
    
    presupuesto.monto = nuevoMonto;
    presupuesto.periodo = nuevoPeriodo;
    alertaPresupuestoMostrada = false; // Reiniciar la alerta al cambiar el presupuesto
    localStorage.setItem('presupuesto', JSON.stringify(presupuesto));
}

// Evento para abrir el modal y mostrar el valor actual
document.addEventListener("DOMContentLoaded", function() {
 inicializarPagina();
});

// Mostrar/ocultar campos según categoría
document.getElementById('categoriaGasto').addEventListener('change', function() {
    const categoria = this.value;
    const camposProducto = document.getElementById('camposProducto');
    const camposServicio = document.getElementById('camposServicio');
    if (categoria === 'servicio') {
        camposProducto.style.display = 'none';
        camposServicio.style.display = '';
    } else {
        camposProducto.style.display = '';
        camposServicio.style.display = 'none';
    }
});

// --- NUEVAS FUNCIONES PARA GESTIÓN DE ÓRDENES ---

function iniciarNuevaOrden() {
    console.log("[EVENTO] iniciarNuevaOrden: Creando estructura para nueva orden.");
    // Crear el objeto de la orden actual
    const ahora = new Date();
    ordenActual = {
        id: ahora.getTime().toString(),
        nombre: '',
        fecha: obtenerFechaLocalISO(ahora),
        gastos: []
    };

    // Actualizar la UI
    document.getElementById('idOrden').textContent = ordenActual.id;
    document.getElementById('fechaOrden').textContent = ordenActual.fecha;
    document.getElementById('nombreOrden').value = '';

    // Mostrar el área de trabajo y ocultar el botón de crear
    document.getElementById('areaDeTrabajo').style.display = 'block';
    document.getElementById('contenedorBtnNuevaOrden').style.display = 'none';

    limpiarTablaGastosActuales();
    actualizarResumen();
    document.getElementById('nombreOrden').focus();
}

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

    // Actualizar el nombre en el objeto de la orden
    ordenActual.nombre = nombre;

    // Agregar la orden completa al array de órdenes
    ordenes.push(ordenActual);
    guardarOrdenesLocalStorage();

    renderizarTablaOrdenes();

    mostrarExito(`Orden a nombre de '${nombre}' guardada correctamente.`);
    
    // Resetear la UI
    resetearVistaOrden();
}

function cancelarOrden() {
    resetearVistaOrden();
    console.log("[EVENTO] cancelarOrden: Orden cancelada, vista reseteada.");
}

function resetearVistaOrden() {
    ordenActual = null;
    console.log("[INFO] resetearVistaOrden: Limpiando la orden actual y la UI.");
    document.getElementById('areaDeTrabajo').style.display = 'none';
    document.getElementById('contenedorBtnNuevaOrden').style.display = 'block';
    limpiarTablaGastosActuales();
    actualizarResumen();
}

function renderizarTablaOrdenes() {
    console.log("[EVENTO] renderizarTablaOrdenes: Mostrando órdenes guardadas.");
    const cuerpoTabla = document.getElementById('cuerpoTablaOrdenes');
    if (!cuerpoTabla) {
        console.error("El cuerpo de la tabla de órdenes no fue encontrado.");
        return;
    }
    cuerpoTabla.innerHTML = '';

    // Mostrar las órdenes más recientes primero
    const ordenesInvertidas = [...ordenes].reverse();

    if (ordenesInvertidas.length === 0) {
        cuerpoTabla.innerHTML = '<tr><td colspan="6" class="text-center">No hay órdenes guardadas.</td></tr>';
        return;
    }

    ordenesInvertidas.forEach(orden => {
        const totalOrden = orden.gastos.reduce((sum, gasto) => sum + parseFloat(gasto.montoTotal), 0);
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${orden.id}</td>
            <td>${orden.nombre}</td>
            <td>${orden.fecha}</td>
            <td>$${totalOrden.toFixed(2)}</td>
            <td class="text-center">${orden.gastos.length}</td>
            <td>
                <button class="btn btn-info btn-sm me-1" onclick="verDetallesOrden('${orden.id}')" data-bs-toggle="tooltip" title="Ver Detalles">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="eliminarOrden('${orden.id}')" data-bs-toggle="tooltip" title="Eliminar Orden">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        cuerpoTabla.appendChild(fila);
    });
    
    // Re-inicializar tooltips para los nuevos botones
    const tooltips = document.querySelectorAll('#cuerpoTablaOrdenes [data-bs-toggle="tooltip"]');
    tooltips.forEach(t => new bootstrap.Tooltip(t));
}

function eliminarOrden(id) {
    console.log(`[EVENTO] eliminarOrden: Intentando eliminar orden con ID ${id}`);
    Swal.fire({
        title: '¿Eliminar esta orden?',
        text: "Se eliminarán todos los gastos asociados a esta orden. Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: 'var(--card-bg)'
    }).then((result) => {
        if (result.isConfirmed) {
            ordenes = ordenes.filter(orden => orden.id !== id);
            guardarOrdenesLocalStorage();
            renderizarTablaOrdenes();
            actualizarResumen(); // Actualizar el presupuesto global
            console.log(`[ÉXITO] Orden con ID ${id} eliminada.`);
            mostrarExito("Orden eliminada correctamente.");
        }
    });
}

function verDetallesOrden(id) {
    console.log(`[EVENTO] verDetallesOrden: Mostrando detalles para la orden ID ${id}`);
    const orden = ordenes.find(o => o.id === id);

    if (!orden) {
        console.error(`No se encontró la orden con ID ${id}`);
        mostrarError("No se pudo encontrar la orden seleccionada.");
        return;
    }

    // Poblar la información general del modal
    document.getElementById('modalDetallesOrdenLabel').textContent = `Detalles de la Orden #${orden.id}`;
    document.getElementById('detalleOrdenId').textContent = orden.id;
    document.getElementById('detalleOrdenNombre').textContent = orden.nombre;
    document.getElementById('detalleOrdenFecha').textContent = orden.fecha;

    // Poblar la tabla de gastos
    const cuerpoTabla = document.getElementById('cuerpoTablaDetallesOrden');
    cuerpoTabla.innerHTML = ''; // Limpiar tabla anterior

    if (orden.gastos.length === 0) {
        cuerpoTabla.innerHTML = '<tr><td colspan="8" class="text-center">Esta orden no tiene gastos registrados.</td></tr>';
    } else {
        orden.gastos.forEach(gasto => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${gasto.tipoGasto}</td>
                <td>${gasto.conceptoGasto}</td>
                <td>${gasto.establecimiento}</td>
                <td>${gasto.nombreProducto}</td>
                <td>${gasto.unidades}</td>
                <td>${gasto.medidaUnidad}</td>
                <td>$${parseFloat(gasto.precioUnidad || 0).toFixed(2)}</td>
                <td>$${parseFloat(gasto.montoTotal).toFixed(2)}</td>
            `;
            cuerpoTabla.appendChild(fila);
        });
    }

    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('modalDetallesOrden'));
    modal.show();
}