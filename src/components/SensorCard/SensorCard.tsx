type SensorCardProps = {
  icono: string;
  titulo: string;
  valor: string;
  unidad: string;
  estado: string;
};

function SensorCard({
  icono,
  titulo,
  valor,
  unidad,
  estado,
}: SensorCardProps) {

  let colorEstado = "#22c55e";

  if (estado === "Advertencia") colorEstado = "#facc15";
  if (estado === "Crítico") colorEstado = "#ef4444";

  return (
    <div className="card">

      <div className="icono">
        {icono}
      </div>

      <div className="titulo">
        {titulo.toUpperCase()}
      </div>

      <div className="valor">
        {valor}
      </div>

      <div className="unidad">
        {unidad}
      </div>

      <div
        className="barra"
      >
        <div
          className="progreso"
        ></div>
      </div>

      <div
        className="estado"
        style={{ color: colorEstado }}
      >
        ● {estado}
      </div>

    </div>
  );
}

export default SensorCard;