var dialogUsuarioUdg;
var myNavigator;
var codigoAlumno;
var nombreAlumno;
var interval;
var map;
var infowindow;

function iniciar()
{
    console.log("iniciar()");
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
        var nombre = localStorage.getItem('nombreUsuario');
        page.querySelector('ons-toolbar .center').innerHTML = nombre;
        page.querySelector("#botonCerrarSesion").onclick = cerrarSesion;
        initMap(page);
    }
    else if(page.id === "paginaInicioSesion")
    {
        page.querySelector("#botonIniciarSesion").onclick = function(){
            enviar(page);
        };
    }
});



function guardarEnLocalStorage(codigo, nombre)
{
    localStorage.setItem('codigoUsuario', codigo);
    localStorage.setItem('nombreUsuario', nombre);
}



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


/* autentifica si eres alumno/profesor udg */
function enviar(page)
{
    var codigo = page.querySelector("#codigoEstudiante").value;
    var nip = page.querySelector("#nip").value;

    console.log("codigo: " + codigo);
    console.log("contraseña: " + nip);

    // comprobar que los campos no esten vacíos
    if(codigo === "" || nip === "")
    {
    	ons.notification.alert("Error: debes llenar todos los campos");
    }
    else
    {
	    // enviamos las variables al servidor y recojemos la respuesta
	    var xhttp = new XMLHttpRequest();
	    xhttp.onreadystatechange = function()
	    {
	        if(this.readyState == 4 && this.status == 200)
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
			        if(this.readyState == 4 && this.status == 200)
			        {
                        console.log("Respuesta: " + this.responseText);
			        	// el script devuelve el tipo de usuario, codigo y nombre
			        	var respuesta = this.responseText.split(",");
			        	var res = respuesta[0];
			        	var nombreRes = respuesta[1];

			        	// usuario udg registrado
			        	if(res === "usuario udg registrado"){
                            guardarEnLocalStorage(codigo, nombreRes)
			        		iniciarPaginaMapaEstacionamiento();
			        	}
			        	// usuario udg no registrado
			        	else if(res === "usuario udg no registrado"){
			        		iniciarDialogUsuarioUdg();
			        	}
			        	// usuario normal registrado
			        	else if(res === "usuario registrado"){
			        		guardarEnLocalStorage(codigo, nombreRes)
			        		iniciarPaginaMapaEstacionamiento();
			        	}
			        	// usuario no registrado
			        	else if(res === "usuario no registrado"){
			        		nuevoUsuario();
			        	}
			        	else // ocurrió un error
			        	{
			        		ons.notification.alert("Ocurrió un error");
			        	}
			        }
			    };

			    xhttp.open("GET", "https://adrianpl.000webhostapp.com/avance3.php?codigo=" + codigo + "&contrasenia=" + nip + "&tipoUsuario=" + tipoUsuario, true);
	    		xhttp.send();
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
        if(this.readyState == 4 && this.status == 200)
        {
            if(this.responseText[0] == "1")
            {
                guardarEnLocalStorage(codigo, nombre);
                iniciarPaginaMapaEstacionamiento();
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
        		document.getElementById('codigoGenerado').innerText = codigoGenerado;
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
    var codigo = document.getElementById('codigoGenerado').innerText;
    var nombre = document.getElementById('nombreNuevoUsuario').value;
    var placas = document.getElementById('placasNuevoUsuario').value;
    var telefono = document.getElementById('telefonoNuevoUsuario').value;
    var contrasenia = document.getElementById('contraseniaNuevoUsuario').value;
    var contraseniaRepetida = document.getElementById('contrasenia2NuevoUsuario').value;

    if(!nombre)
        ons.notification.alert("El nombre no puede estar vacío");
    else if(!placas)
        ons.notification.alert("Las placas no pueden estar vacías");
    else if(!telefono)
        ons.notification.alert("El teléfono no puede estar vacío");
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
}



function ubicacionesLugaresOcupados()
{
    infowindow = new google.maps.InfoWindow();
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function()
    {
        if(this.readyState == 4 && this.status == 200)
        {
            if(JSON.stringify(this.response) == "0")
            {
                ons.notification.alert("Ocurrió un error al cargar las ubicaciones");
            }
            else
            {
                var lugaresOcupados = this.response['ubicaciones'];

                for(var i = 0; i < lugaresOcupados.length; i++)
                {
                    var latitud = JSON.parse(lugaresOcupados[i].latitud);
                    var longitud = JSON.parse(lugaresOcupados[i].longitud);
                    var ubicacion = new google.maps.LatLng(latitud, longitud);
                    var contentString = '<p>' + lugaresOcupados[i].placas + '</p>';

                    crearMarcador(ubicacion, contentString);
                }
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

}


function cerrarSesion()
{
    localStorage.clear();
    myNavigator.pushPage('paginaInicioSesion.html');
}

window.addEventListener('load', iniciar, false);