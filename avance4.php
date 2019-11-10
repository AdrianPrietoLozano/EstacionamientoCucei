<?php

$conexion = mysqli_connect("remotemysql.com:3306", "mEZnhrxLWk", "6D9dPZhNaK", "mEZnhrxLWk");

if(!$conexion)
{
	echo "0";
	exit();
}
else // conexión exitosa
{
	$json = array();
	
	$consulta = "SELECT * FROM `LugarE`";

	$resultado = mysqli_query($conexion, $consulta);

	if($resultado)
	{
		while($registro = mysqli_fetch_array($resultado))
		{
			$res['placas'] = $registro['Placas'];
			$res['latitud'] = $registro['lat'];
			$res['longitud'] = $registro['lon'];
			$res['ocupado'] = $registro['ocupado'];

			$json['ubicaciones'][]=$res;
		}
		echo json_encode($json);
	}
	else
	{
		echo "0";
	}

	mysqli_close($conexion);
}

?>