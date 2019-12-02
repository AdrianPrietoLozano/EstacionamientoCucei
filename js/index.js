var dialogUsuarioUdg;
var myNavigator;
var codigoAlumno;
var nombreAlumno;
var interval;
var map;
var markers = [];
var infowindow;
var progressBar;
var paginaEstacionamiento;
var paginaRegistro; // 56640

var regExpTelefono = /^\D?(\d{3})\D?\D?(\d{3})\D?(\d{4})$/;
//var regExpPlacas = /[A-Z]{3}-[0-9]{2}[A-Z0-9]/;

function iniciar()
{
    myNavigator = document.getElementById("myNavigator");
    dialogUsuarioUdg = document.getElementById('dialogDatosUsuarioUdg');

    if(localStorage.getItem('codigoUsuario')) {
        iniciarPaginaMapaEstacionamiento();
    } else {
        myNavigator.pushPage('paginaSplashscreen.html');
        interval = window.setInterval("terminarSplashscreen()", 3000);
    }
}



function initMap(page)
{
    map = new google.maps.Map(page.querySelector('#map'), {
        center: {lat: 20.6556784, lng: -103.3248379},
        zoom: 18
    });
}


document.addEventListener('init', function(event){
    var page = event.target;
    
    if(page.id === "paginaMapaEstacionamiento" )
    {
    	paginaEstacionamiento = page;
        var nombre = localStorage.getItem('nombreUsuario');
        page.querySelector('ons-toolbar .center').innerHTML = nombre;
        page.querySelector("#botonCerrarSesion").onclick = cerrarSesion;
        page.querySelector("#botonDesocuparLugar").onclick = desocuparLugar;
        page.querySelector("#botonEstacionarse").onclick = iniciarEstacionarse;
        progressBar = page.querySelector("#cargando");
        initMap(page);
    }
    else if(page.id === "paginaInicioSesion")
    {
        page.querySelector("#botonIniciarSesion").onclick = function(){
            enviar(page);
        };
    }
    else if(page.id === "paginaRegistroNuevoUsuario")
    {
    	paginaRegistro = page;
    }
});


// elimina los marcadores del mapa
function quitarMarcadores()
{
	for(var i = 0; i < markers.length; i++)
	{
		markers[i].setMap(null);
	}

	markers = [];
}


function mostrarBotonesEstacionarse()
{
	paginaEstacionamiento.querySelector("#botonesEstacionarse").style.display = "block";
}


// elimina los marcadores, muestra progress bar
// y si la geolocalizacion esta disponible iniciar
// el proceso para insertar en la BD
function iniciarEstacionarse()
{
	quitarMarcadores(); // quita los marcadores del mapa
	mostrarCargando();
	

	if(navigator.geolocation)
	{
		navigator.geolocation.getCurrentPosition(estacionarse, errorGeolocalizacion, {timeout: 10000});
	}
	else
	{
		ons.notification.alert("Error: No se soporta la geolocalizacion");
	}
}


function errorGeolocalizacion(error)
{
	switch(error.code)
	{
		case error.TIMEOUT:
			ons.notification.alert("ERROR: Tiempo de espera agotado. Verifica que el GPS este activado.");
			break;
		case error.POSITION_UNAVAILABLE:
			ons.notification.alert("ERROR: No pudimos determinar tu ubicación. Verifica que el GPS este activado.")
			break;
		case error.PERMISSION_DENIED:
			ons.notification.alert("ERROR: Permiso denegado.");
			break;
		default:
			ons.notification.alert("Error desconocido.");
			break;
	}
	ubicacionesLugaresOcupados();
}


// esconde la barra de progreso y aumenta el alto del mapa
// para que no quede pantalla en blanco
function esconderCargando()
{
	progressBar.style.display = "none";
	paginaEstacionamiento.querySelector('#map').style.height = "93%";
}


// muestra la barra de progreso y reduce el alto del mapa
// para no esconder los botones de estacionarse y desocupar lugar
function mostrarCargando()
{
	progressBar.style.display = "block";
	paginaEstacionamiento.querySelector('#map').style.height = "87%";
}


// ingresa el registro en la base de datos y recarga los marcadores
function estacionarse(ubicacion)
{
	// enviamos las variables al servidor y recojemos la respuesta
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function()
    {
        if(this.readyState == 4)
        {
        	if(this.status == 200)
        	{
        		switch(this.responseText)
        		{
        			case '0': // no se insertó correctamente
        				ons.notification.alert("Ocurrió un error");
        				break;
        			case '2': // usuario YA estacionado
        				ons.notification.alert("Error: Ya estas estacionado");
        				break;
        		}

        		ubicacionesLugaresOcupados();
        	}
        	else
        	{
        		ubicacionesLugaresOcupados(); // poner marcadores en el mapa
        		ons.notification.alert("Ocurrio un error");
        	}
        }
    };

    var lat = ubicacion.coords.latitude;
    var lon = ubicacion.coords.longitude;

    xhttp.open("GET", "https://adrianpl.000webhostapp.com/estacionarse.php?" + 
    	"latitud=" + lat + "&longitud=" + lon + "&placas=" +
    	localStorage.getItem('placas'), true);
    xhttp.send();

}


// eliminar los marcadores del mapa, muestra el progress bar,
// elimina el registro de la BD y si todo sale bien recarga los marcadores
function desocuparLugar()
{
	quitarMarcadores(); // quita los marcadores del mapa
	mostrarCargando();

	// enviamos las variables al servidor y recojemos la respuesta
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function()
    {
        if(this.readyState == 4 && this.status == 200)
        {
        	switch(this.responseText)
        	{
        		case '0':
        			ons.notification.alert("Ocurrió un error");
        			break;

        		case '2':
        			ons.notification.alert("Error: no estas estacionado");
        			break;
        	}

        	ubicacionesLugaresOcupados();
        }
    };

    xhttp.open("GET", "https://adrianpl.000webhostapp.com/desocupar_lugar.php?" + 
    	"placas=" + localStorage.getItem('placas'), true);
    xhttp.send();
}


function guardarEnLocalStorage(codigo, nombre, placas)
{
    localStorage.setItem('codigoUsuario', codigo);
    localStorage.setItem('nombreUsuario', nombre);
    localStorage.setItem('placas', placas);
}



// inicia la pagina del estacionamiento y pone los marcadores en el mapa
function iniciarPaginaMapaEstacionamiento()
{
	myNavigator.pushPage('paginaMapaEstacionamiento.html');
    ubicacionesLugaresOcupados();
}


/* termina el splashscreen para ir a la pagina de inicio de sesion */
function terminarSplashscreen()
{
    window.clearInterval(interval);
    interval = null;
    myNavigator.pushPage("paginaInicioSesion.html");
}

function deshabilitarBotonIniciarSesion(page)
{
	page.querySelector("#botonIniciarSesion").innerHTML  = "Iniciando sesion ...";
	page.querySelector("#botonIniciarSesion").disabled = true;
}

function habilitarBotonIniciarSesion(page)
{
	page.querySelector("#botonIniciarSesion").innerHTML  = "Ingresar";
	page.querySelector("#botonIniciarSesion").disabled = false;
}


/* autentifica si eres alumno/profesor udg */
function enviar(page)
{
	deshabilitarBotonIniciarSesion(page);

    var codigo = page.querySelector("#codigoEstudiante").value;
    var nip = page.querySelector("#nip").value;

    // comprobar que los campos no esten vacíos
    if(codigo === "" || nip === "")
    {
    	ons.notification.alert("Error: debes llenar todos los campos");
    	habilitarBotonIniciarSesion(page);
    }
    else
    {
	    // enviamos las variables al servidor y recojemos la respuesta
	    var xhttp = new XMLHttpRequest();
	    xhttp.onreadystatechange = function()
	    {
	        if(this.readyState == 4)
	        {
	        	if(this.status == 200)
	        	{
		        	var tipoUsuario; // tipo udg o normal

		            if(parseInt(this.responseText) == 0){
		            	tipoUsuario = "no udg";
		            }
		            else
		            {
		            	var datos = this.responseText.split(",");
		            	codigoAlumno = datos[1];
		            	nombreAlumno = datos[2];
		            	tipoUsuario = "udg";
		            }

		        	var xhttp2 = new XMLHttpRequest();
				    xhttp.onreadystatechange = function()
				    {
				        if(this.readyState == 4)
				        {
				        	if(this.status == 200)
				        	{
		                        console.log("Respuesta: " + this.responseText);
					        	// el script devuelve el tipo de usuario, codigo y nombre
					        	var respuesta = this.responseText.split(",");
					        	var res = respuesta[0];
					        	var nombreRes = respuesta[1];
					        	var placas = respuesta[2];

					        	//ons.notification.alert("placas: " + placas);

					        	// usuario udg registrado
					        	if(res === "usuario udg registrado"){
					        		habilitarBotonIniciarSesion(page);
		                            guardarEnLocalStorage(codigo, nombreRes, placas)
					        		iniciarPaginaMapaEstacionamiento();
					        	}
					        	// usuario udg no registrado
					        	else if(res === "usuario udg no registrado"){
					        		habilitarBotonIniciarSesion(page);
					        		iniciarDialogUsuarioUdg();
					        	}
					        	// usuario normal registrado
					        	else if(res === "usuario registrado"){
					        		habilitarBotonIniciarSesion(page);
					        		guardarEnLocalStorage(codigo, nombreRes, placas)
					        		iniciarPaginaMapaEstacionamiento();
					        	}
					        	// usuario no registrado
					        	else if(res === "usuario no registrado"){
					        		habilitarBotonIniciarSesion(page);
					        		nuevoUsuario();
					        	}
					        	else // ocurrió un error
					        	{
					        		ons.notification.alert("Ocurrió un error");
					        		habilitarBotonIniciarSesion(page);
					        	}
					        }
					        else
					        {
					        	ons.notification.alert("Ocurrió un error. Vuelve a intentarlo");
					        	habilitarBotonIniciarSesion(page);
					        }

				        }
				    };

				    xhttp.open("GET", "https://adrianpl.000webhostapp.com/avance3.php?codigo=" + codigo + "&contrasenia=" + nip + "&tipoUsuario=" + tipoUsuario, true);
		    		xhttp.send();
		    	}
		    	else
	        	{
	        		ons.notification.alert("Ocurrió un error. Vuelve a intentarlo");
	        		habilitarBotonIniciarSesion(page);
	        	}
	        	
	        }
	    };

	    xhttp.open("GET", "https://dcc.000webhostapp.com/2018/datosudeg.php?codigo="+codigo+"&nip="+nip, true);
	    xhttp.send();
	}
}


/* muestra la pantalla emergente para pedir placas y telefono */
function iniciarDialogUsuarioUdg()
{
    document.getElementById('nombreUsuarioUdg').innerText = nombreAlumno;
    dialogUsuarioUdg.show();
}


/* registra en la base de datos del profesor y redirige a la página del mapa */
function registrarUsuarioBD(codigo, nombre, placas, telefono, contrasenia)
{
    // enviamos las variables al servidor y recojemos la respuesta
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function()
    {
        if(this.readyState == 4)
        {
        	if(this.status == 200)
        	{
	            if(this.responseText[0] == "1")
	            {
	                guardarEnLocalStorage(codigo, nombre, placas);
	                iniciarPaginaMapaEstacionamiento();
	            }
	            else
	            {
	                ons.notification.alert("Ocurrio un error");
	            }
        	}
        	else
        	{
        		ons.notification.alert("Ocurrio un error");
        	}
        }
    };

    xhttp.open("GET", "https://cuceimobile.tech/Escuela/altaU.php?codigo="+codigo+
        "&nombre=" +nombre+ "&placas=" +placas+ "&telefono=" +telefono+
        "&password=" +contrasenia, true);
    xhttp.send();
}


/* registra a un alumno udg en la base de datos del profe */
function registrarDatosUsuarioUdg()
{
    /* COMPROBAR QUE LOS DATOS NO ESTEN VACIOS */
    var placas = document.getElementById('placas').value;
    var telefono = document.getElementById('telefono').value;

    if(!placas)
        ons.notification.alert("Las placas no pueden estar vacías");
    else if(!telefono)
        ons.notification.alert("El teléfono no puede estar vacío");
    else
    {
    	cerrarDialog(dialogUsuarioUdg);
        registrarUsuarioBD(codigoAlumno, nombreAlumno, placas, telefono, "");
    }
}

/* cierra la pantalla emergente del alumno/maestro udg */
function cancelarDatos()
{
    cerrarDialog(dialogUsuarioUdg);
}


/* cierra el dialog pasado como parámetro */
function cerrarDialog(dialog)
{
    dialog.hide();
}


/* muestra la pantalla para agregar un nuevo usuario */
function nuevoUsuario()
{
    myNavigator.pushPage("paginaRegistroNuevoUsuario.html")
        .then(function ()
        	{
        		var codigoGenerado = generarCodigo();
        		paginaRegistro.querySelector('#codigoGenerado').innerText = codigoGenerado;
        	});
}


/* genera un codigo aleatorio */
function generarCodigo()
{
    var caracteres = "0123456789";
    var longitud = 5;
    var code = "";
    
    for (x=0; x < longitud; x++)
    {
        rand = Math.floor(Math.random() * caracteres.length);
        code += caracteres.substr(rand, 1);
    }
    
    return code;
}


/* registra un usuario que no es de udg */
function registrarNuevoUsuario()
{
	//paginaRegistro.querySelector("#botonRegistrarNuevo").disabled = true;
	//paginaRegistro.querySelector("#botonRegistrarNuevo").innerHTML = "Registrando ...";


    var codigo = paginaRegistro.querySelector('#codigoGenerado').innerText;
    var nombre = paginaRegistro.querySelector('#nombreNuevoUsuario').value;
    var placas = paginaRegistro.querySelector('#placasNuevoUsuario').value;
    var telefono = paginaRegistro.querySelector('#telefonoNuevoUsuario').value;
    var contrasenia = paginaRegistro.querySelector('#contraseniaNuevoUsuario').value;
    var contraseniaRepetida = paginaRegistro.querySelector('#contrasenia2NuevoUsuario').value;

    if(!nombre)
        ons.notification.alert("El nombre no puede estar vacío");
    else if(!placas)
        ons.notification.alert("Placas no válidas");
    else if(!(regExpTelefono.test(telefono)))
        ons.notification.alert("Teléfono no válido");
    else if(!contrasenia)
        ons.notification.alert("La contraseña no puede estar vacía");
    else if(!contraseniaRepetida)
        ons.notification.alert("Es necesario repetir la contraseña");
    else
    {
        if(contrasenia != contraseniaRepetida)
        	ons.notification.alert("Las contraseñas no coinciden");
        else
        {
            registrarUsuarioBD(codigo, nombre, placas, telefono, contrasenia);
        }
    }

    //paginaRegistro.querySelector("#botonRegistrarNuevo").disabled = false;
	//paginaRegistro.querySelector("#botonRegistrarNuevo").innerHTML = "Registrarse";
}

//52665

// muestra un marcador por cada lugar ocupado del estacionamiento.
function ubicacionesLugaresOcupados()
{
    infowindow = new google.maps.InfoWindow();
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function()
    {
        if(this.readyState == 4)
        {
        	if(this.status == 200)
        	{

        		if(JSON.stringify(this.response) == "0")
            	{
                	ons.notification.alert("Ocurrió un error al cargar las ubicaciones");
            	}
            	else
            	{
                	var lugaresOcupados = this.response['ubicaciones'];

                	console.log(lugaresOcupados);
                	console.log(typeof lugaresOcupados);

	                for(var i = 0; i < lugaresOcupados.length; i++)
	                {
	                	//var obj = JSON.parse(lugaresOcupados[i]);
	                    var ubicacion = new google.maps.LatLng(lugaresOcupados[i].latitud, lugaresOcupados[i].longitud);
	                    var contentString = '<p>' + lugaresOcupados[i].placas + '</p>';

	                    crearMarcador(ubicacion, contentString);
	                }
	                mostrarBotonesEstacionarse();
            	}
            	esconderCargando();
        	}
        	else
        	{
        		esconderCargando();
        		ons
  					.notification.alert({message: 'Ocurrió un error. La página se recargará'})
  					.then(function(name) {
    					mostrarCargando();
    					ubicacionesLugaresOcupados();
  					});
        	}
        }
    };

    xhttp.open("GET", "https://adrianpl.000webhostapp.com/avance4.php", true);
    xhttp.responseType = 'json';
    xhttp.send();
    
}

function crearMarcador(ubicacion, contenidoInfoWindow) {
      var marker = new google.maps.Marker({
          position: ubicacion,
          map: map
    });


    google.maps.event.addListener(marker, 'click', function () {
        infowindow.setContent(contenidoInfoWindow);
        infowindow.open(map, marker);
    });

    markers.push(marker);

}


function cerrarSesion()
{
    localStorage.clear();
    myNavigator.pushPage('paginaInicioSesion.html');
}

window.addEventListener('load', iniciar, false);