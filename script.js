/*  script.js - Carrito con toppings, pago simulado y recomendación por temperatura
    Reemplaza:
      - telefonoWhatsapp por tu número (ej: '57300xxxxxxx')
*/

document.addEventListener('DOMContentLoaded', () => {
  // Toggle carrito lateral
  const toggleCarritoBtn = document.getElementById('toggle-carrito');
  const carritoEl = document.getElementById('carrito');

  toggleCarritoBtn.addEventListener('click', () => {
    carritoEl.classList.toggle('activo');
  });

  /* ===== CONFIGURACIÓN ===== */
  const telefonoWhatsapp = '573156051971'; // <-- Reemplaza con tu número (sin +)
  const precioBase = 8000; // precio base por granizado (sin toppings)

  /* ===== ELEMENTOS DOM ===== */
  const añadirBtns = document.querySelectorAll('.añadir-carrito');
  const carritoLista = document.getElementById('carrito-lista');
  const carritoTotalSpan = document.getElementById('carrito-total');
  const btnPagar = document.getElementById('btn-pagar');
  const btnEnviarWhatsapp = document.getElementById('btn-enviar-whatsapp');
  const modalPago = document.getElementById('modal-pago');
  const cerrarModal = document.getElementById('cerrar-modal');
  const formPago = document.getElementById('form-pago');
  const recomendacionEl = document.getElementById('recomendacion-temperatura');
  const pedidoWhatsappHero = document.getElementById('pedido-whatsapp');
  const contactoWhatsapp = document.getElementById('contacto-whatsapp');

  /* ===== ESTADO ===== */
  let carrito = []; // cada item: {id, nombre, cantidad, toppings:[], precioUnitario, precioToppings}

  /* ===== FUNCIONES DE AYUDA ===== */
  function calcularPrecioToppings(toppings) {
    const precios = {
      'Leche condensada': 1000,
      'Chispas de colores': 500,
      'Gomitas': 700,
      'Chocolate': 1000,
      'Coco rallado': 700,
      'Pasta de tamarindo': 500,
      'Mentitas': 500,
      'Miel': 700,
      'Semillas de maracuyá': 500,
      'Chispas de chocolate': 1000,
      'Galleta triturada': 700,
      'Leche de coco': 1000,
      'Sirope de caramelo': 800,
      'Sal de fruta': 200,
      'Sirope de miel': 700
    };
    let total = 0;
    toppings.forEach(t => {
      total += precios[t] || 0;
    });
    return total;
  }

  function formatearMoneda(n) {
    return `$${n.toLocaleString('es-CO')}`;
  }

  function actualizarCarritoVista() {
    carritoLista.innerHTML = '';
    if (carrito.length === 0) {
      carritoLista.innerHTML = '<li>Tu carrito está vacío</li>';
      carritoTotalSpan.textContent = formatearMoneda(0);
      return;
    }

    let total = 0;
    carrito.forEach((item, index) => {
      const itemPrecioUnitario = item.precioUnitario + item.precioToppings;
      const itemSubtotal = itemPrecioUnitario * item.cantidad;
      total += itemSubtotal;

      const li = document.createElement('li');

      const desc = document.createElement('div');
      desc.style.flex = '1';
      desc.innerHTML = `<strong>${item.nombre}</strong><br>
                        ${item.toppings.length ? `<small>Toppings: ${item.toppings.join(', ')}</small><br>` : ''}
                        <small>Cant: ${item.cantidad} · ${formatearMoneda(itemPrecioUnitario)} c/u</small>`;

      const acciones = document.createElement('div');
      acciones.style.display = 'flex';
      acciones.style.flexDirection = 'column';
      acciones.style.gap = '6px';
      acciones.style.alignItems = 'flex-end';

      const btnEliminar = document.createElement('button');
      btnEliminar.textContent = 'Eliminar';
      btnEliminar.className = 'button--small';
      btnEliminar.onclick = () => {
        carrito.splice(index, 1);
        actualizarCarritoVista();
      };

      const btnMas = document.createElement('button');
      btnMas.textContent = '+';
      btnMas.className = 'button--small';
      btnMas.onclick = () => {
        item.cantidad++;
        actualizarCarritoVista();
      };

      const btnMenos = document.createElement('button');
      btnMenos.textContent = '-';
      btnMenos.className = 'button--small';
      btnMenos.onclick = () => {
        if (item.cantidad > 1) item.cantidad--;
        else carrito.splice(index, 1);
        actualizarCarritoVista();
      };

      const precioSmall = document.createElement('small');
      precioSmall.textContent = formatearMoneda(itemSubtotal);

      const botonesCantidad = document.createElement('div');
      botonesCantidad.style.display = 'flex';
      botonesCantidad.style.gap = '6px';
      botonesCantidad.appendChild(btnMenos);
      botonesCantidad.appendChild(btnMas);

      acciones.appendChild(botonesCantidad);
      acciones.appendChild(precioSmall);
      acciones.appendChild(btnEliminar);

      li.appendChild(desc);
      li.appendChild(acciones);
      carritoLista.appendChild(li);
    });

    carritoTotalSpan.textContent = formatearMoneda(total);
  }

  /* ===== AÑADIR PRODUCTO ===== */
  añadirBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.card');
      const nombre = card.dataset.nombre;
      const precioUnitario = Number(card.dataset.precio) || precioBase;
      const cantidadInput = card.querySelector('.cantidad-input');
      const cantidad = Math.max(1, parseInt(cantidadInput.value) || 1);

      const toppingsChecked = Array.from(card.querySelectorAll('.toppings__list input[type="checkbox"]:checked'))
        .map(i => i.value);

      const precioToppings = calcularPrecioToppings(toppingsChecked);

      const item = {
        id: Date.now() + Math.random(),
        nombre,
        cantidad,
        toppings: toppingsChecked,
        precioUnitario,
        precioToppings
      };

      carrito.push(item);
      actualizarCarritoVista();

      e.target.textContent = 'Añadido ✓';
      setTimeout(() => e.target.textContent = 'Añadir', 1000);
    });
  });

  /* ===== ENVIAR PEDIDO POR WHATSAPP ===== */
  function construirMensajeWhatsApp(metodoPago = 'No especificado') {
    if (carrito.length === 0) return '¡Hola! Quiero hacer un pedido, pero mi carrito está vacío.';

    let lines = ['¡Hola Frescazo! 👋 Quiero hacer este pedido:'];
    carrito.forEach((it, idx) => {
      const toppingsText = it.toppings.length ? ` (Toppings: ${it.toppings.join(', ')})` : '';
      lines.push(`${idx + 1}. ${it.nombre}${toppingsText} — Cant: ${it.cantidad}`);
    });

    let total = 0;
    carrito.forEach(it => total += (it.precioUnitario + it.precioToppings) * it.cantidad);
    lines.push(`Total: ${formatearMoneda(total)}`);
    lines.push(`Método de pago: ${metodoPago}`);
    lines.push('Envíame por favor la confirmación y tiempo de entrega. Gracias!');
    return lines.join('\n');
  }

  btnEnviarWhatsapp.addEventListener('click', () => {
    const mensaje = construirMensajeWhatsApp('Por definir');
    const url = `https://api.whatsapp.com/send?phone=${telefonoWhatsapp}&text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  });

  pedidoWhatsappHero.addEventListener('click', (e) => {
    e.preventDefault();
    const mensaje = construirMensajeWhatsApp('Por definir');
    const url = `https://api.whatsapp.com/send?phone=${telefonoWhatsapp}&text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  });

  contactoWhatsapp && contactoWhatsapp.addEventListener('click', (e) => {
    e.preventDefault();
    const mensaje = construirMensajeWhatsApp('Por definir');
    const url = `https://api.whatsapp.com/send?phone=${telefonoWhatsapp}&text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  });

  /* ===== PAGO SIMULADO ===== */
  btnPagar.addEventListener('click', () => {
    if (carrito.length === 0) {
      alert('Tu carrito está vacío.');
      return;
    }
    modalPago.style.display = 'flex';
  });

  cerrarModal.addEventListener('click', () => {
    modalPago.style.display = 'none';
  });

  formPago.addEventListener('submit', (e) => {
    e.preventDefault();
    const metodo = document.querySelector('input[name="metodo-pago"]:checked').value;
    alert(`Pago simulado realizado con éxito. Método: ${metodo}`);
    const mensaje = construirMensajeWhatsApp(metodo);
    const url = `https://api.whatsapp.com/send?phone=${telefonoWhatsapp}&text=${encodeURIComponent(mensaje)}`;
    carrito = [];
    actualizarCarritoVista();
    modalPago.style.display = 'none';
    window.open(url, '_blank');
  });

  window.addEventListener('click', (e) => {
    if (e.target === modalPago) modalPago.style.display = 'none';
  });

  /* ===== RECOMENDACIÓN SEGÚN TEMPERATURA (Open-Meteo) ===== */
  async function obtenerClima(lat, lon) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
      const resp = await fetch(url);
      const data = await resp.json();
      return data.current_weather.temperature;
    } catch (e) {
      console.error("Error obteniendo clima:", e);
      return null;
    }
  }

  function mostrarRecomendacion(temp) {
    let recomendacion = "";
    if (temp >= 28) {
      recomendacion = `Hace ${temp}°C 🥵. ¡Te recomendamos un granizado cítrico (Limón o Maracuyá)! 🍋`;
    } else if (temp >= 20) {
      recomendacion = `Hace ${temp}°C 😎. ¡Un granizado frutal (Fresa, Mango, Mora) es perfecto! 🍓🥭`;
    } else {
      recomendacion = `Hace ${temp}°C 🥶. ¡Prueba un granizado cremoso o con toppings dulces! 🥥🍫`;
    }
    recomendacionEl.innerText = recomendacion;
  }

  function recomendarPorUbicacion() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const temp = await obtenerClima(lat, lon);

        if (temp !== null) {
          mostrarRecomendacion(temp);
        } else {
          recomendacionEl.innerText = "No se pudo obtener la temperatura.";
        }
      }, () => {
        recomendacionEl.innerText = "Activa tu ubicación para obtener recomendaciones personalizadas.";
      });
    } else {
      recomendacionEl.innerText = "Tu navegador no soporta geolocalización.";
    }
  }

  /* ===== Inicializar ===== */
  actualizarCarritoVista();
  recomendarPorUbicacion();
});
