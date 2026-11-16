import { useCallback, useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function solicitar(ruta, token, opciones = {}) {
  const cabeceras = { ...opciones.headers };
  if (opciones.body) cabeceras['Content-Type'] = 'application/json';
  if (token) cabeceras.Authorization = `Bearer ${token}`;

  const respuesta = await fetch(`${API_URL}${ruta}`, { ...opciones, headers: cabeceras });
  if (respuesta.status === 204) return null;

  const resultado = await respuesta.json();
  if (!respuesta.ok) {
    const detalle = resultado.errors?.map((error) => error.msg).join('. ');
    throw new Error(resultado.error || detalle || 'No se pudo completar la solicitud');
  }
  return resultado.data;
}

const formularioVehiculo = {
  marca: '',
  modelo: '',
  patente: '',
  anio: '',
  capacidadCarga: '',
};

const formularioConductor = {
  nombre: '',
  apellido: '',
  numeroDocumento: '',
  numeroLicencia: '',
  fechaAltaLicencia: '',
  fechaVencimientoLicencia: '',
};

const formularioViaje = {
  vehiculoId: '',
  conductorId: '',
  fechaSalida: '',
  fechaLlegada: '',
  origen: '',
  destino: '',
  kilometros: '',
  observaciones: '',
};

function Mensaje({ texto, error = false }) {
  if (!texto) return null;
  return <p className={error ? 'mensaje error' : 'mensaje exito'} role="status">{texto}</p>;
}

function InicioPublico({ alIngresar }) {
  return (
    <main className="portada">
      <div className="portada-fondo" />
      <header className="barra-publica">
        <a className="marca" href="/" aria-label="Inicio TransPort 3000">
          <span className="marca-icono">T</span>
          <span>TransPort <strong>3000</strong><small>S.A</small></span>
        </a>
        <button className="boton boton-claro" onClick={alIngresar}>Iniciar sesión</button>
      </header>
      <section className="portada-contenido">
        <p className="sobrelinea">GESTIÓN DE TRANSPORTE</p>
        <h1>Cada viaje,<br />en buenas manos.</h1>
        <p className="portada-descripcion">
          Una forma simple de organizar vehículos, conductores y recorridos de TransPort 3000 S.A.
        </p>
        <button className="boton boton-principal" onClick={alIngresar}>
          Ingresar al sistema <span aria-hidden="true">→</span>
        </button>
        <div className="portada-detalles">
          <span>01 <small>Flota</small></span>
          <span>02 <small>Conductores</small></span>
          <span>03 <small>Viajes</small></span>
        </div>
      </section>
      <footer className="portada-pie">TransPort 3000 S.A <span>·</span> Administración de transporte</footer>
    </main>
  );
}

function Acceso({ alAutenticar, volver }) {
  const [registro, setRegistro] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const enviar = async (evento) => {
    evento.preventDefault();
    setError('');
    setMensaje('');
    setCargando(true);
    try {
      const datos = registro
        ? await solicitar('/auth/register', null, {
          method: 'POST',
          body: JSON.stringify({ nombre, email, contrasena }),
        })
        : await solicitar('/auth/login', null, {
          method: 'POST',
          body: JSON.stringify({ email, contrasena }),
        });

      if (registro) {
        setRegistro(false);
        setContrasena('');
        setMensaje('Cuenta creada. Ahora podés iniciar sesión.');
      } else {
        alAutenticar(datos);
      }
    } catch (solicitudError) {
      setError(solicitudError.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="acceso-pagina">
      <button className="enlace-volver" onClick={volver}>← Volver al inicio</button>
      <section className="acceso-tarjeta">
        <a className="marca marca-oscura" href="/" onClick={(evento) => { evento.preventDefault(); volver(); }}>
          <span className="marca-icono">T</span>
          <span>TransPort <strong>3000</strong><small>S.A</small></span>
        </a>
        <p className="sobrelinea">{registro ? 'NUEVA CUENTA' : 'ACCESO AL SISTEMA'}</p>
        <h1>{registro ? 'Crear cuenta' : 'Bienvenido de nuevo'}</h1>
        <p className="texto-secundario">
          {registro ? 'Registrate para comenzar a administrar tus viajes.' : 'Ingresá tus datos para continuar.'}
        </p>
        <form className="formulario" onSubmit={enviar}>
          {registro && (
            <label>
              Nombre
              <input autoComplete="name" maxLength="100" minLength="2" onChange={(evento) => setNombre(evento.target.value)} required value={nombre} />
            </label>
          )}
          <label>
            Correo electrónico
            <input autoComplete="email" onChange={(evento) => setEmail(evento.target.value)} required type="email" value={email} />
          </label>
          <label>
            Contraseña
            <input autoComplete={registro ? 'new-password' : 'current-password'} maxLength="72" minLength={registro ? '8' : undefined} onChange={(evento) => setContrasena(evento.target.value)} required type="password" value={contrasena} />
          </label>
          <Mensaje error texto={error} />
          <Mensaje texto={mensaje} />
          <button className="boton boton-principal boton-ancho" disabled={cargando} type="submit">
            {cargando ? 'Procesando…' : registro ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
        </form>
        <p className="alternar-acceso">
          {registro ? '¿Ya tenés una cuenta?' : '¿Todavía no tenés una cuenta?'}{' '}
          <button onClick={() => { setRegistro(!registro); setError(''); setMensaje(''); }} type="button">
            {registro ? 'Iniciar sesión' : 'Registrate'}
          </button>
        </p>
      </section>
    </main>
  );
}

function Campo({ label, tipo = 'text', valor, cambiar, requerido = true, ...atributos }) {
  return (
    <label>
      {label}
      <input
        onChange={(evento) => cambiar(evento.target.value)}
        required={requerido}
        type={tipo}
        value={valor}
        {...atributos}
      />
    </label>
  );
}

function PanelVehiculos({ token }) {
  const [vehiculos, setVehiculos] = useState([]);
  const [formulario, setFormulario] = useState(formularioVehiculo);
  const [edicion, setEdicion] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const resultado = await solicitar('/vehiculos?limit=100&offset=0', token);
      setVehiculos(resultado.data);
      setError('');
    } catch (solicitudError) {
      setError(solicitudError.message);
    }
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiar = (campo, valor) => setFormulario((actual) => ({ ...actual, [campo]: valor }));
  const limpiar = () => {
    setFormulario(formularioVehiculo);
    setEdicion(null);
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    setMensaje('');
    setError('');
    try {
      await solicitar(edicion ? `/vehiculos/${edicion}` : '/vehiculos', token, {
        method: edicion ? 'PUT' : 'POST',
        body: JSON.stringify(formulario),
      });
      setMensaje(edicion ? 'Vehículo actualizado.' : 'Vehículo agregado.');
      limpiar();
      await cargar();
    } catch (solicitudError) {
      setError(solicitudError.message);
    }
  };

  const editar = (vehiculo) => {
    setEdicion(vehiculo.id);
    setFormulario({
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      patente: vehiculo.patente,
      anio: String(vehiculo.anio),
      capacidadCarga: String(vehiculo.capacidadCarga),
    });
    setMensaje('');
  };

  const eliminar = async (id) => {
    setMensaje('');
    setError('');
    try {
      await solicitar(`/vehiculos/${id}`, token, { method: 'DELETE' });
      setMensaje('Vehículo eliminado.');
      await cargar();
    } catch (solicitudError) {
      setError(solicitudError.message);
    }
  };

  return (
    <section className="contenido-pagina">
      <div className="encabezado-pagina">
        <div><p className="sobrelinea">ADMINISTRACIÓN</p><h1>Vehículos</h1></div>
        <span className="contador">{vehiculos.length} registrados</span>
      </div>
      <div className="rejilla-contenido">
        <section className="panel tarjeta-formulario">
          <h2>{edicion ? 'Editar vehículo' : 'Agregar vehículo'}</h2>
          <form className="formulario" onSubmit={guardar}>
            <Campo label="Marca" maxLength="100" cambiar={(valor) => cambiar('marca', valor)} valor={formulario.marca} />
            <Campo label="Modelo" maxLength="100" cambiar={(valor) => cambiar('modelo', valor)} valor={formulario.modelo} />
            <Campo label="Patente" maxLength="20" cambiar={(valor) => cambiar('patente', valor)} valor={formulario.patente} />
            <div className="campos-dobles">
              <Campo label="Año" max={new Date().getFullYear() + 1} min="1900" cambiar={(valor) => cambiar('anio', valor)} tipo="number" valor={formulario.anio} />
              <Campo label="Capacidad (kg)" min="0.01" step="0.01" cambiar={(valor) => cambiar('capacidadCarga', valor)} tipo="number" valor={formulario.capacidadCarga} />
            </div>
            <Mensaje error texto={error} />
            <Mensaje texto={mensaje} />
            <div className="acciones-formulario">
              <button className="boton boton-principal" type="submit">{edicion ? 'Guardar cambios' : 'Agregar vehículo'}</button>
              {edicion && <button className="boton boton-secundario" onClick={limpiar} type="button">Cancelar</button>}
            </div>
          </form>
        </section>
        <section className="panel tabla-panel">
          <div className="titulo-panel"><div><p className="sobrelinea">FLOTA</p><h2>Vehículos registrados</h2></div></div>
          {vehiculos.length ? (
            <div className="tabla-scroll"><table>
              <thead><tr><th>Vehículo</th><th>Patente</th><th>Año</th><th>Capacidad</th><th>Acciones</th></tr></thead>
              <tbody>{vehiculos.map((vehiculo) => (
                <tr key={vehiculo.id}>
                  <td><strong>{vehiculo.marca}</strong><small>{vehiculo.modelo}</small></td>
                  <td><span className="etiqueta">{vehiculo.patente}</span></td>
                  <td>{vehiculo.anio}</td>
                  <td>{Number(vehiculo.capacidadCarga).toLocaleString('es-AR')} kg</td>
                  <td><div className="acciones-tabla"><button className="boton-texto" onClick={() => editar(vehiculo)}>Editar</button><button className="boton-texto boton-peligro" onClick={() => eliminar(vehiculo.id)}>Eliminar</button></div></td>
                </tr>
              ))}</tbody>
            </table></div>
          ) : <p className="vacio">Todavía no hay vehículos registrados.</p>}
        </section>
      </div>
    </section>
  );
}

function PanelConductores({ token }) {
  const [conductores, setConductores] = useState([]);
  const [formulario, setFormulario] = useState(formularioConductor);
  const [edicion, setEdicion] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const resultado = await solicitar('/conductores?limit=100&offset=0', token);
      setConductores(resultado.data);
      setError('');
    } catch (solicitudError) {
      setError(solicitudError.message);
    }
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);
  const cambiar = (campo, valor) => setFormulario((actual) => ({ ...actual, [campo]: valor }));
  const limpiar = () => {
    setFormulario(formularioConductor);
    setEdicion(null);
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    setMensaje('');
    setError('');
    try {
      await solicitar(edicion ? `/conductores/${edicion}` : '/conductores', token, {
        method: edicion ? 'PUT' : 'POST',
        body: JSON.stringify(formulario),
      });
      setMensaje(edicion ? 'Conductor actualizado.' : 'Conductor agregado.');
      limpiar();
      await cargar();
    } catch (solicitudError) {
      setError(solicitudError.message);
    }
  };

  const editar = (conductor) => {
    setEdicion(conductor.id);
    setFormulario({
      nombre: conductor.nombre,
      apellido: conductor.apellido,
      numeroDocumento: conductor.numeroDocumento,
      numeroLicencia: conductor.numeroLicencia,
      fechaAltaLicencia: String(conductor.fechaAltaLicencia).slice(0, 10),
      fechaVencimientoLicencia: String(conductor.fechaVencimientoLicencia).slice(0, 10),
    });
    setMensaje('');
  };

  const eliminar = async (id) => {
    setMensaje('');
    setError('');
    try {
      await solicitar(`/conductores/${id}`, token, { method: 'DELETE' });
      setMensaje('Conductor eliminado.');
      await cargar();
    } catch (solicitudError) {
      setError(solicitudError.message);
    }
  };

  return (
    <section className="contenido-pagina">
      <div className="encabezado-pagina">
        <div><p className="sobrelinea">EQUIPO</p><h1>Conductores</h1></div>
        <span className="contador">{conductores.length} registrados</span>
      </div>
      <div className="rejilla-contenido">
        <section className="panel tarjeta-formulario">
          <h2>{edicion ? 'Editar conductor' : 'Agregar conductor'}</h2>
          <form className="formulario" onSubmit={guardar}>
            <div className="campos-dobles">
              <Campo label="Nombre" maxLength="100" cambiar={(valor) => cambiar('nombre', valor)} valor={formulario.nombre} />
              <Campo label="Apellido" maxLength="100" cambiar={(valor) => cambiar('apellido', valor)} valor={formulario.apellido} />
            </div>
            <Campo label="Número de documento" maxLength="30" cambiar={(valor) => cambiar('numeroDocumento', valor)} valor={formulario.numeroDocumento} />
            <Campo label="Número de licencia" maxLength="30" cambiar={(valor) => cambiar('numeroLicencia', valor)} valor={formulario.numeroLicencia} />
            <div className="campos-dobles">
              <Campo label="Alta de licencia" cambiar={(valor) => cambiar('fechaAltaLicencia', valor)} tipo="date" valor={formulario.fechaAltaLicencia} />
              <Campo label="Vencimiento" cambiar={(valor) => cambiar('fechaVencimientoLicencia', valor)} tipo="date" valor={formulario.fechaVencimientoLicencia} />
            </div>
            <Mensaje error texto={error} />
            <Mensaje texto={mensaje} />
            <div className="acciones-formulario">
              <button className="boton boton-principal" type="submit">{edicion ? 'Guardar cambios' : 'Agregar conductor'}</button>
              {edicion && <button className="boton boton-secundario" onClick={limpiar} type="button">Cancelar</button>}
            </div>
          </form>
        </section>
        <section className="panel tabla-panel">
          <div className="titulo-panel"><div><p className="sobrelinea">PERSONAL</p><h2>Conductores registrados</h2></div></div>
          {conductores.length ? (
            <div className="tabla-scroll"><table>
              <thead><tr><th>Conductor</th><th>Documento</th><th>Licencia</th><th>Vencimiento</th><th>Acciones</th></tr></thead>
              <tbody>{conductores.map((conductor) => (
                <tr key={conductor.id}>
                  <td><strong>{conductor.nombre} {conductor.apellido}</strong></td>
                  <td>{conductor.numeroDocumento}</td>
                  <td>{conductor.numeroLicencia}</td>
                  <td>{String(conductor.fechaVencimientoLicencia).slice(0, 10)}</td>
                  <td><div className="acciones-tabla"><button className="boton-texto" onClick={() => editar(conductor)}>Editar</button><button className="boton-texto boton-peligro" onClick={() => eliminar(conductor.id)}>Eliminar</button></div></td>
                </tr>
              ))}</tbody>
            </table></div>
          ) : <p className="vacio">Todavía no hay conductores registrados.</p>}
        </section>
      </div>
    </section>
  );
}

function fechaLocal(valor) {
  if (!valor) return '';
  const fecha = new Date(valor);
  return new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function PanelViajes({ token }) {
  const [viajes, setViajes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [resumen, setResumen] = useState({ vehiculos: [], conductores: [] });
  const [filtroVehiculo, setFiltroVehiculo] = useState('');
  const [filtroConductor, setFiltroConductor] = useState('');
  const [formulario, setFormulario] = useState(formularioViaje);
  const [edicion, setEdicion] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const filtros = new URLSearchParams({ limit: '100', offset: '0' });
      const filtrosResumen = new URLSearchParams();
      if (filtroVehiculo) {
        filtros.set('vehiculoId', filtroVehiculo);
        filtrosResumen.set('vehiculoId', filtroVehiculo);
      }
      if (filtroConductor) {
        filtros.set('conductorId', filtroConductor);
        filtrosResumen.set('conductorId', filtroConductor);
      }
      const [lista, datosResumen, listaVehiculos, listaConductores] = await Promise.all([
        solicitar(`/viajes?${filtros}`, token),
        solicitar(`/viajes/resumen?${filtrosResumen}`, token),
        solicitar('/vehiculos?limit=100&offset=0', token),
        solicitar('/conductores?limit=100&offset=0', token),
      ]);
      setViajes(lista.data);
      setResumen(datosResumen);
      setVehiculos(listaVehiculos.data);
      setConductores(listaConductores.data);
      setError('');
    } catch (solicitudError) {
      setError(solicitudError.message);
    }
  }, [filtroConductor, filtroVehiculo, token]);

  useEffect(() => { cargar(); }, [cargar]);
  const cambiar = (campo, valor) => setFormulario((actual) => ({ ...actual, [campo]: valor }));
  const limpiar = () => {
    setFormulario(formularioViaje);
    setEdicion(null);
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    setMensaje('');
    setError('');
    try {
      const datos = {
        ...formulario,
        vehiculoId: Number(formulario.vehiculoId),
        conductorId: Number(formulario.conductorId),
        fechaLlegada: formulario.fechaLlegada || null,
        kilometros: Number(formulario.kilometros),
      };
      await solicitar(edicion ? `/viajes/${edicion}` : '/viajes', token, {
        method: edicion ? 'PUT' : 'POST',
        body: JSON.stringify(datos),
      });
      setMensaje(edicion ? 'Viaje actualizado.' : 'Viaje registrado.');
      limpiar();
      await cargar();
    } catch (solicitudError) {
      setError(solicitudError.message);
    }
  };

  const editar = (viaje) => {
    setEdicion(viaje.id);
    setFormulario({
      vehiculoId: String(viaje.vehiculoId),
      conductorId: String(viaje.conductorId),
      fechaSalida: fechaLocal(viaje.fechaSalida),
      fechaLlegada: fechaLocal(viaje.fechaLlegada),
      origen: viaje.origen,
      destino: viaje.destino,
      kilometros: String(viaje.kilometros),
      observaciones: viaje.observaciones || '',
    });
    setMensaje('');
  };

  const eliminar = async (id) => {
    setMensaje('');
    setError('');
    try {
      await solicitar(`/viajes/${id}`, token, { method: 'DELETE' });
      setMensaje('Viaje eliminado.');
      await cargar();
    } catch (solicitudError) {
      setError(solicitudError.message);
    }
  };

  return (
    <section className="contenido-pagina">
      <div className="encabezado-pagina">
        <div><p className="sobrelinea">RECORRIDOS</p><h1>Viajes</h1></div>
        <span className="contador">{viajes.length} en pantalla</span>
      </div>
      <div className="tarjetas-resumen">
        <article className="panel tarjeta-resumen">
          <p>Kilómetros por vehículo</p>
          {resumen.vehiculos.length ? resumen.vehiculos.map((vehiculo) => (
            <div className="fila-resumen" key={vehiculo.id}>
              <span>{vehiculo.patente} <small>{vehiculo.marca} {vehiculo.modelo}</small></span>
              <strong>{Number(vehiculo.totalKilometros).toLocaleString('es-AR')} <small>km</small></strong>
            </div>
          )) : <span className="texto-secundario">Sin vehículos para mostrar.</span>}
        </article>
        <article className="panel tarjeta-resumen">
          <p>Kilómetros por conductor</p>
          {resumen.conductores.length ? resumen.conductores.map((conductor) => (
            <div className="fila-resumen" key={conductor.id}>
              <span>{conductor.nombre} {conductor.apellido}</span>
              <strong>{Number(conductor.totalKilometros).toLocaleString('es-AR')} <small>km</small></strong>
            </div>
          )) : <span className="texto-secundario">Sin conductores para mostrar.</span>}
        </article>
      </div>
      <section className="panel filtros-panel">
        <div className="filtro">
          <label htmlFor="filtro-vehiculo">Filtrar por vehículo</label>
          <select id="filtro-vehiculo" onChange={(evento) => setFiltroVehiculo(evento.target.value)} value={filtroVehiculo}>
            <option value="">Todos los vehículos</option>
            {vehiculos.map((vehiculo) => <option key={vehiculo.id} value={vehiculo.id}>{vehiculo.patente} — {vehiculo.marca} {vehiculo.modelo}</option>)}
          </select>
        </div>
        <div className="filtro">
          <label htmlFor="filtro-conductor">Filtrar por conductor</label>
          <select id="filtro-conductor" onChange={(evento) => setFiltroConductor(evento.target.value)} value={filtroConductor}>
            <option value="">Todos los conductores</option>
            {conductores.map((conductor) => <option key={conductor.id} value={conductor.id}>{conductor.nombre} {conductor.apellido}</option>)}
          </select>
        </div>
      </section>
      <div className="rejilla-contenido">
        <section className="panel tarjeta-formulario">
          <h2>{edicion ? 'Editar viaje' : 'Registrar viaje'}</h2>
          {(!vehiculos.length || !conductores.length) && <p className="aviso">Primero registrá al menos un vehículo y un conductor.</p>}
          <form className="formulario" onSubmit={guardar}>
            <label>
              Vehículo
              <select onChange={(evento) => cambiar('vehiculoId', evento.target.value)} required value={formulario.vehiculoId}>
                <option value="">Seleccionar vehículo</option>
                {vehiculos.map((vehiculo) => <option key={vehiculo.id} value={vehiculo.id}>{vehiculo.patente} — {vehiculo.marca} {vehiculo.modelo}</option>)}
              </select>
            </label>
            <label>
              Conductor
              <select onChange={(evento) => cambiar('conductorId', evento.target.value)} required value={formulario.conductorId}>
                <option value="">Seleccionar conductor</option>
                {conductores.map((conductor) => <option key={conductor.id} value={conductor.id}>{conductor.nombre} {conductor.apellido}</option>)}
              </select>
            </label>
            <div className="campos-dobles">
              <Campo label="Fecha de salida" cambiar={(valor) => cambiar('fechaSalida', valor)} tipo="datetime-local" valor={formulario.fechaSalida} />
              <Campo label="Fecha de llegada" cambiar={(valor) => cambiar('fechaLlegada', valor)} requerido={false} tipo="datetime-local" valor={formulario.fechaLlegada} />
            </div>
            <div className="campos-dobles">
              <Campo label="Origen" maxLength="150" cambiar={(valor) => cambiar('origen', valor)} valor={formulario.origen} />
              <Campo label="Destino" maxLength="150" cambiar={(valor) => cambiar('destino', valor)} valor={formulario.destino} />
            </div>
            <Campo label="Kilómetros" min="0.01" step="0.01" cambiar={(valor) => cambiar('kilometros', valor)} tipo="number" valor={formulario.kilometros} />
            <label>
              Observaciones
              <textarea maxLength="5000" onChange={(evento) => cambiar('observaciones', evento.target.value)} rows="3" value={formulario.observaciones} />
            </label>
            <Mensaje error texto={error} />
            <Mensaje texto={mensaje} />
            <div className="acciones-formulario">
              <button className="boton boton-principal" disabled={!vehiculos.length || !conductores.length} type="submit">
                {edicion ? 'Guardar cambios' : 'Registrar viaje'}
              </button>
              {edicion && <button className="boton boton-secundario" onClick={limpiar} type="button">Cancelar</button>}
            </div>
          </form>
        </section>
        <section className="panel tabla-panel">
          <div className="titulo-panel"><div><p className="sobrelinea">HISTORIAL</p><h2>Viajes registrados</h2></div></div>
          {viajes.length ? (
            <div className="tabla-scroll"><table>
              <thead><tr><th>Salida</th><th>Vehículo / conductor</th><th>Trayecto</th><th>Kilómetros</th><th>Acciones</th></tr></thead>
              <tbody>{viajes.map((viaje) => (
                <tr key={viaje.id}>
                  <td>{new Date(viaje.fechaSalida).toLocaleString('es-AR')}</td>
                  <td><strong>{viaje.patenteVehiculo}</strong><small>{viaje.nombreConductor} {viaje.apellidoConductor}</small></td>
                  <td>{viaje.origen}<small>→ {viaje.destino}</small></td>
                  <td>{Number(viaje.kilometros).toLocaleString('es-AR')} km</td>
                  <td><div className="acciones-tabla"><button className="boton-texto" onClick={() => editar(viaje)}>Editar</button><button className="boton-texto boton-peligro" onClick={() => eliminar(viaje.id)}>Eliminar</button></div></td>
                </tr>
              ))}</tbody>
            </table></div>
          ) : <p className="vacio">No hay viajes para los filtros seleccionados.</p>}
        </section>
      </div>
    </section>
  );
}

function PanelPrincipal({ token, usuario, cerrarSesion }) {
  const [seccion, setSeccion] = useState('viajes');
  const menu = [
    { id: 'viajes', nombre: 'Viajes', icono: '↗' },
    { id: 'vehiculos', nombre: 'Vehículos', icono: '▰' },
    { id: 'conductores', nombre: 'Conductores', icono: '◉' },
  ];

  return (
    <div className="aplicacion">
      <aside className="barra-lateral">
        <a className="marca marca-oscura" href="/" aria-label="Panel TransPort 3000">
          <span className="marca-icono">T</span>
          <span>TransPort <strong>3000</strong><small>S.A</small></span>
        </a>
        <p className="menu-titulo">MENÚ PRINCIPAL</p>
        <nav aria-label="Secciones principales">
          {menu.map((item) => (
            <button className={seccion === item.id ? 'menu-enlace activo' : 'menu-enlace'} key={item.id} onClick={() => setSeccion(item.id)}>
              <span>{item.icono}</span>{item.nombre}
            </button>
          ))}
        </nav>
        <div className="perfil-usuario">
          <span className="avatar">{usuario.nombre.charAt(0).toUpperCase()}</span>
          <span className="perfil-datos"><strong>{usuario.nombre}</strong><small>{usuario.email}</small></span>
          <button aria-label="Cerrar sesión" className="boton-salir" onClick={cerrarSesion} title="Cerrar sesión">↪</button>
        </div>
      </aside>
      <main className="zona-principal">
        <header className="barra-superior">
          <span>TransPort <strong>3000 S.A</strong></span>
          <span className="estado-sistema"><i /> Sistema operativo</span>
        </header>
        {seccion === 'vehiculos' && <PanelVehiculos token={token} />}
        {seccion === 'conductores' && <PanelConductores token={token} />}
        {seccion === 'viajes' && <PanelViajes token={token} />}
      </main>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem('token') || '');
  const [usuario, setUsuario] = useState(null);
  const [seccionPublica, setSeccionPublica] = useState('inicio');
  const [cargando, setCargando] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setUsuario(null);
      setCargando(false);
      return;
    }

    solicitar('/auth/me', token)
      .then(setUsuario)
      .catch(() => {
        sessionStorage.removeItem('token');
        setToken('');
        setUsuario(null);
      })
      .finally(() => setCargando(false));
  }, [token]);

  const iniciarSesion = ({ token: nuevoToken, user }) => {
    sessionStorage.setItem('token', nuevoToken);
    setUsuario(user);
    setToken(nuevoToken);
  };

  const cerrarSesion = () => {
    sessionStorage.removeItem('token');
    setToken('');
    setUsuario(null);
    setSeccionPublica('inicio');
  };

  if (cargando) {
    return <main className="pantalla-carga"><span className="marca-icono">T</span><p>Conectando con TransPort 3000 S.A…</p></main>;
  }
  if (usuario && token) return <PanelPrincipal token={token} usuario={usuario} cerrarSesion={cerrarSesion} />;
  if (seccionPublica === 'acceso') {
    return <Acceso alAutenticar={iniciarSesion} volver={() => setSeccionPublica('inicio')} />;
  }
  return <InicioPublico alIngresar={() => setSeccionPublica('acceso')} />;
}
