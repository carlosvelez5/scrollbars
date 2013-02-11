/**
 *
 * Scroll bar´s v. 1.0 
 *
 * @decription: Crea un scroll personalizado con css y con los eventos del mouse.
 * @date : 05/02/2012 - @update 28/08/2012
 * @Create by : Carlos David Vélez Estrada
 * @Email : creacion.paginasweb@hotmail.com
 * @website : http://www.creacionwebamalfi.com/
 * @email : cadavestra@gmail.com
 * All rights reserved - uses free
 *
*/
( function( $ ){
   /**
    * Objecto scroll bars
	*/
	$.scroll_bars = $.scroll_bars || {};
   
   /**¡
    * Opciones por defecto 
	*/
	$.scroll_bars.defauls = {
		/** Opciones ****/
		options: {
			animate 		: true,
			bar_size		: true,
			hide			: false,
			wheel			: 80,
			speed			: 200,
			easing			: 'easeOutQuart',
			clase_contenido : '.content_div',
			/**** styles css *****/
			css_barra		: null,
			css_barrita		: null,
			css_contenido 	: null,
			debug			: false,
			
			// Distancia mínima para lanzar funcion de top o bottom
			distance		: 20,
			
			// Configuración para el evento
			event_settings	: {
				// Para el evento de mousewheel activity
				latency : 1500,
				mouseover : true
			},
						
			/* Eventos */
			init			: function(){ },
			onTop   		: function(){ },
			onBottom   		: function(){ },
			onUpdate   		: function(){ },
			onScroll		: function(){ },
			
			/** Variables ***/
			prop			: { }
		}
	}
	
	$.fn.scroll_bars = function( options ){
				
		return this.each(function(){
			/** Opciones ***/
			var wrap	= $( this );
			/**** Establecer opciones ****/
			var _opt		= $.extend( {}, $.scroll_bars.defauls.options, options || {} ),
				settings	= $.extend( {}, _opt,  wrap.data() || {} );
			
			var   
				/******** Elementos ********/
				barra = $( document.createElement( "div" ) ).addClass( "barra_scroll" ),
				barrita = $( document.createElement( "div" ) ).addClass( "barrita_scroll" ),
				contenido = wrap.find( settings.clase_contenido ), 
				
				/******** Control ********/
				control, ctrl_top = false, ctrl_bottom = false, page_y,
				
				/****** Posiciones Y alturas ******/ 
				posicionX, posicionY, barra_height, init_fn = true,
				container_height = wrap.outerHeight(), contenido_height = contenido.outerHeight( true ),
				barra_height, barrita_height, total = 0,
				
				/****** Otras variables ***********/
				factor, ocultar = true,	moveto = new Object(),				
				easing = typeof jQuery.easing[ settings.easing ] == "undefined" ? "" : settings.easing, 
				prop = { duration: settings.speed, easing: easing, queue:false }, self = this;
			
			
			/**** Mostrar mensaje ****/
			var _debug = function (){
				// Mostrar msg en la consola
				if( window.console && window.console.log && settings.debug == true )
					console.log( arguments ); 
			},
			
			// Comprueba si la variable es string
			isString = function( str ) {
				return $.type( str ) === "string";
			},
			
			// Comprueba si la variable es de porcentage
			isPercentage = function( str ) {
				return isString( str ) && str.charAt( str.length - 1 ) == "%";
			},
			
			/*** Iniciar scroll ***/
			init = function () {
				// Remover scroll si existia
				if( wrap.data( "scroll_settings" ) )
					endEvent();
				
				// Plugins
				settings._plugins = { 
					// Actividad de mousewheel
					scroll_activity : !!jQuery.event.special.mousewheelactivity,
					// mousewheel plugin
					mousewheel : !!jQuery.event.special.mousewheel
				}
				
				// Iniciar funciones
				setSize();  setEvent();
				
				// Guardar datos
				wrap.data( "scroll_settings", settings );
				
				// Llamar funcion de inicio
				_call( "init" );
				
				return wrap;
			},
			
			_int = function( number, comprobar ){
				/*** if Is number ***/
				if( !isNaN( parseFloat( number ) ) )
					return comprobar ? true : parseFloat( number );
				
				// Retornar false
				if( comprobar )
					return false;
				
				_debug ( "[" + number + "] No es un número." );
				return false;
			},
			
			/*** Asiganar eventos ****/
			setEvent = function() {	
				// Mostrar msg de plugins					 
				_debug( !settings._plugins.mousewheel ? 
					"The file \"jquery.mousewheel.min.js\" was not found." : 
					"$.scroll_bars working with \"jquery.mousewheel.min.js\"");
				
				function _mousewheel( evt, evt_type, delta, deltaX, deltaY ){
					// Determinar que tipo de evento fue llamado
					switch ( evt_type ){
						// En caso de que sea mousewheel
						case "mousewheel" :
							// Llamar funcion de mousewheel
							onmouse( evt, delta, deltaX, deltaY, true );							
						break;
						
						// Mostrar o ocultar barra
						case "start" :
						case "stop" :
							// Ocultar scroll
							if( settings.hide == true ){
								/**** Evento por defecto ****/
								try {
								
								if ( evt.preventDefault ) evt.preventDefault();
								else if( evt.returnValue ) evt.returnValue = false;
								
								} catch( exception ) { };								
								
								// llamar evento
								evt_type == "start" ? mouse_hover() : mouse_out();
							}							
						break;
					}										
				};
				
				if( settings._plugins.mousewheel && !settings._plugins.scroll_activity ){
					/**** mousewheel con el plugin ****/
					wrap.mousewheel( onmouse );
					
				} else if( settings._plugins.mousewheel && settings._plugins.scroll_activity ){
					/*** Asignar evento de mousewheel con los plugins */
					wrap.bind( "mousewheelactivity", settings.event_settings, _mousewheel );
					
					// Ocultar scroll por primera vez
					settings.hide == true ? mouse_out() : "";
					
				} else {
					/**** mousewheel con javascript ****/
					if( this.addEventListener ){
						wrap[0].addEventListener("DOMMouseScroll", onmouse, false );
						wrap[0].addEventListener("mousewheel", onmouse, false );						
					} else {
						wrap[0].onmousewheel = onmouse;
					}
				}
				
				barra.bind( "mousedown.scroll", barra_click );
				barrita.bind( "mousedown", onstar );
				
				// Asignar eventos a el contenido
				wrap.bind({
					// Actualizar scroll
					scroll_update : onupdate, // update					
					// Subir scroll
					gototop : ontop,
					// bajar scroll
					gotobottom : onbottom,
					// Remover scroll
					scroll_remove : endEvent, // remove_scroll
					// Ir a...
					scroll_goto : _goto // goto					
				});
				
				// Ocultar barrita
				scroll_hide();
				
				/**** Evento de mouse up ***/
				mouse_up();
			},
			
			/**** Establecer tamaños ****/
			setSize = function () {
				// Agregar elementos
				wrap.prepend( barra.append( barrita ) );
				
				if( _int( settings.bar_size, true ) ){
					// Tamaño fijo de la barra
					barra_height = _int( settings.bar_size );
					
				} else {
					// Tamaño dinámico
					barra_height = container_height;
				}
				
				// Asignar alturas.
				barra.setOuterHeight( barra_height ); //barra.height( barra_height );
				barra_height = barra.height();
				
				// Obtener factor.
				factor = contenido_height / barra_height;			
				control = contenido_height > container_height;
				
				barrita_height = barra_height / factor;
				barrita.setOuterHeight( barrita_height );
				barrita_height = barrita.height();
				
				// Ubicar barra y barrita
				barrita.css( "top", '0px' );
				barra.css( "top", '-1px' );
				
				/** Guardar datos ***/
				settings.prop.height = {
					wrap_scroll : container_height,
					warp_content : contenido_height,
					barra : barra_height,
					barrita : barrita_height,
					factor : factor	
				}
				
				if( !control )  barra.fadeOut( 0 );
				
				/**** Estilos ****/
				_styles();
			},
			
			_styles = function (){
				/**** css styles ****/
				wrap.css( "position", "relative" );
				contenido.css( "position", "relative" );
				
				if( typeof settings.css_barra == "object" )
					barra.css( settings.css_barra );
					
				if( typeof settings.css_barrita == "object" )
					barrita.css( settings.css_barrita );
					
				if( typeof settings.css_contenido == "object" )
					contenido.css( settings.css_contenido );
			},
			
			endEvent = function(){
				// Eliminar datos 
				wrap.removeData( "scroll_settings" );
				
				/**** Eliminar eventos ****/
				wrap.unbind(); barra.unbind();
				
				$( document ).unbind( "mousemove.scroll", ondrag ).unbind('mouseup.scroll'); 
				
				if( settings._plugins.mousewheel && !settings._plugins.scroll_activity ){
					/**** mousewheel con el plugin ****/
					wrap.unmousewheel( onmouse );
					
				} else if( settings._plugins.mousewheel && settings._plugins.scroll_activity ){
					/*** remover evento de mousewheel con los plugins ***/
					wrap.unbind( "mousewheelactivity" );
					
				} else {
					/**** mousewheel con javascript ****/
					if( this.removeEventListener ) {
						/**** all browsers except IE before version 9 ****/
						wrap[0].removeEventListener("DOMMouseScroll", onmouse, false);
						wrap[0].removeEventListener("mousewheel", onmouse, false);
					} else {
						wrap[0].onmousewheel = null;
					}
				}
				
				wrap.find( ".barra_scroll" ).remove();
			},
			
			scroll_hide = function () {
				// Solo si en la configuración esta activada la opcion
				if( settings.hide == true ){
						
					if( !settings._plugins.scroll_activity ){
						/**** Ocultar scroll con los eventos de mouseover y mouseout ****/
						wrap.hover( mouse_hover, mouse_out ).trigger('mouseout');
					}
					/**** Mostrar msg ****/
					_debug( !settings._plugins.scroll_activity ? 
						"The file \"mousewheel_activity.min.js\" was not found." : 
						"$.scroll_bars working with \"mousewheel_activity.min.js\"");
				}
			},
			
			mouse_hover = function ( evt ){
				// Aplicar scroll
				control = contenido_height > container_height;
				
				if( control ){
					//barra.stop().animate({ opacity : 1 }, "slow" );
					barra.stop( true, true ).fadeIn('slow'); 
					
				} else {
					//barra.stop().animate({ opacity : 0 }, "fast" );
					barra.stop( true, true ).fadeOut('slow');
				}					
			},
			
			mouse_out = function( evt ){
				// No ocultar mientras el evento ondrag
				if( ocultar == true && !barrita.data( "evt_org" ) ) {
					//barra.stop().animate({ opacity : 0 }, "fast" );
					barra.stop( true, true ).fadeOut('fast');
					
				} else {
					//barra.stop().animate({ opacity : 1 }, "slow" );
					barra.stop().show();
				}
			},
			
			/** Actualizar evento ***/
			update_event_drag = function( evt, dd ){
				// starting mouse position
				evt.startX = dd.pageX;
				evt.startY = dd.pageY;
				
				// current distance dragged
				evt.deltaX = evt.pageX - dd.pageX;
				evt.deltaY = evt.pageY - dd.pageY;
				
				// original element position
				evt.originalX = dd.offset.left;
				evt.originalY = dd.offset.top;
				
				// adjusted element position
				evt.offsetX = evt.originalX + evt.deltaX; 
				evt.offsetY = evt.originalY + evt.deltaY;
				
				// modificado 
				evt.top = dd.top;
				
				return evt;
			},
			
			onmouse  = function( event, delta, deltaX, deltaY, plugin ) {
				// Detener animaciones.
				wrap.stop( true, false ); barrita.stop(true, false);
				
				// No hay que aplicar scroll
				if( contenido.outerHeight() <= wrap.outerHeight() ) return false;	
				
				var posicion_final, evt = plugin ? event : ( event || window.event );	
				
				delta = plugin ? delta : ( evt.wheelDelta ? evt.wheelDelta / 120 : -evt.detail / 3 );
				
				// Permitir ocultar barrita
				ocultar = true;
				
				/*** Evento por defecto ****/			
				if ( evt.preventDefault )
					evt.preventDefault();
				else
					evt.returnValue = false;
					
				/* Ensayo */
				total = ( total + ( delta * settings.wheel ) ) > 0 ? 0 : ( total + ( delta * settings.wheel ) ); 
				posicion_final = total > 0 ? settings.wheel*-1 : total;
				
				// Llamar funcion
				_call( "onScroll", evt );
				
				// Mover contenedor					
				return moveto = _moveTo( posicion_final * -1 );
			},
				
			onstar = function( evt ){
			 	try {
				/**** Importante para evitar la seleccion del texto ****/
				if ( evt.preventDefault )
					evt.preventDefault();
				else if( evt.returnValue )
					evt.returnValue = false;
				
				// Detener propagacion de evento
				evt.stopImmediatePropagation();	// stopImmediatePropagation - stopPropagation
					
				} catch( exception ) { };
				
				/*** Posicion original del elemento ****/
				evt.offset = barrita.offset();
				evt.top = barrita.css("top") == "auto" ? 0 : _int( barrita.css("top") );
				
				/*** Guardar datos ***/
				barrita.data( "evt_org", evt );

				/**** Evento mousemove ****/
				$( document ).bind( "mousemove.scroll", ondrag );
				
				/**** No ocultar barra ***/
				ocultar = false;			
			},
			
			ondrag = function( evt ){
				/**** Eventos por defecto ****/
				evt.preventDefault();
				//evt.stopPropagation();
				
				// Obtener nuevas posiciones
				evt = update_event_drag( evt, barrita.data( "evt_org" ) );
				
				/**** posicion del mouse ***/
				var y = evt.startY - ( evt.pageY + evt.top );
				y = y < 0 ? y : 0;

				// Mover contenedor 
				return moveto = _moveTo( ( y * -1 ) * factor, true );				
			},
			
			mouse_up = function(){
				// Evento mouseup
				$( document ).bind( "mouseup.scroll", function( evt ){ 
					try {
					/**** Importante para evitar el desplazamiento del scroll. ****/
					if ( evt.preventDefault )
						evt.preventDefault();
					else if( evt.returnValue )
						evt.returnValue = false;
							
					} catch( exception ) { };
					
					/*** Eliminar datos ***/
					barrita.removeData( "evt_org" );
					ocultar = true;
			
					$( document ).unbind( "mousemove.scroll" );								
				});
			},
			
			barra_click = function( evt ){				
				// Evento por defecto
				evt.preventDefault();
				
				// Posicion del click
				posicionY = evt.pageY;
				var posicion = posicionY - barra.offset().top;
				
				// Llevar la barra hasta el final
				if( ( barra_height - posicion ) < barrita_height && posicion > barrita_height ){
					// la barrita está llegando al final.
					posicion = posicion - barrita_height;
								
				// Llevar la barrita hasta la mitad
				} else if( posicion > barrita_height ){
					// Restarle a la posicion del click la mitad
					// de la altura de la barrita
					posicion = posicion - ( barrita_height / 2 );
				}
				
				// Mover contenedor 
				return moveto = _moveTo( posicion * factor );
			},
			
			onupdate = function(){
				// No actualizar el scroll.
				if( !wrap.is(":visible") || !contenido.is(":visible") )
					return false;
				
				var top_contenido = contenido.css( "top" ) == 'auto' ? 0 : _int( contenido.css( "top" ) );
					
				/************* Actualizar variables *********/				
				container_height = wrap.outerHeight(),
				contenido_height = contenido.outerHeight( true );				
				
				if( _int( settings.bar_size, true ) ){
					// Tamaño fijo de la barra
					barra_height = _int( settings.bar_size );
					
				} else {
					// Tamaño dinámico
					barra_height = container_height;
				}
				
				// Asignar alturas.
				barra.setOuterHeight( barra_height ); //barra.height( barra_height );
				barra_height = barra.height();
				
				// Obtener factor.
				factor = contenido_height / barra_height;			
				control = contenido_height > container_height;			
				
				// Establecer valor de outerHeight
				barrita.setOuterHeight( barra_height / factor, false, true );
				barrita_height = barrita.data( "_outerHeight" );
				
				// Animar barrita
				barrita.stop().animate({ "height" : barrita_height + "px" }, { duration: settings.speed, easing: easing, queue:false });
				
				/** Guardar datos ***/
				settings.prop.height = {
					wrap_scroll : container_height,
					warp_content : contenido_height,
					barra : barra_height,
					barrita : barrita_height,
					factor : factor	
				}
				
				if( ( top_contenido > 0 ) || ( contenido_height <= container_height ) ){
					// Subir scroll					
					top_contenido = 0;
					
					// Ocultar barra
					barra.fadeOut( 0 );
							
				} else {
					// Mostrar barra
					barra.fadeIn( 0 );
					
					// Mover elementos
					top_contenido = ( top_contenido * -1 ) + 0.001;
				}
				// Mover elementos
				moveto = _moveTo( top_contenido );
					
				// Llamar funcion.
				_call( "onUpdate" );								
			},
			
			ontop = function() {
				/**** Ir arriba ****/
				_goto( {}, "0%" );
			},
			
			onbottom = function() {
				/**** Ir abajo ****/
				_goto( {}, "100%" );				
			},
			
			// Agrega el valor a una variable
			_getValueAdd = function( check_val, val ){
				// Optener metodo a aplicar
				var method = ( check_val + "" ).charAt( 0 );
				
				if( method == "+" ){
					// Sumar a la posición
					return _int( val ) + _int( check_val );
					
				} else if( method == "-" ){
					// Restar a la posicion.
					return ( ( _int( val ) * -1 ) - _int( check_val ) );
				}
				
				// No se ha realizado ninguna opción
				return false;				
			},
			
			// Calcula la posicion para mover el contenedor y la barrita y la funcion a aplicar.
			_moveTo = function( number, ondrag ){
				// Variables 
				var current_pos = contenido.css( "top" ) == 'auto' ? 0 : ( _int( contenido.css( "top" ) ) * -1 ),				
					limit_wrap = contenido_height - container_height,
					new_val = _getValueAdd( number, current_pos ),
					move_to = new_val ? ( new_val < 0 ? new_val * -1 : new_val ) : _int( number );
				
				// Opciones por defecto
				moveto.warp = null;
				moveto.barra = null;
				moveto._function = "";
				moveto.move = false;
				moveto.percent = null;
				
				// El scroll ha llegado al inicio
				limit_wrap = Math.max( 0, limit_wrap );
				
				// Posicion para mover el contenedor
				move_to = Math.min( limit_wrap, Math.max( move_to, 0 ) );
				
				/*** El scroll ha llegado al inicio ****/
				if( ( settings.distance * factor ) > move_to ){
					// Funcion de ontop
					moveto._function = "onTop";
					ctrl_bottom = false;
					
				/*** El scroll ha llegado al final ****/
				} else if( move_to >= ( limit_wrap - ( settings.distance * factor ) ) ){
					// Llamar funcion de onBottom 
					moveto._function = "onBottom";
					ctrl_top = false;
						
				} else {
					// No llamar ninguna funcion
					ctrl_top = false;
					ctrl_bottom = false;	
				}
				
				// Comprobar valores.	
				moveto.move = move_to !== current_pos;
				moveto.barra = move_to / factor;					
				moveto.warp = total = move_to * -1;
					
				if( moveto.move ){					
					// Calcular porcentage
					moveto.percent = ( move_to * 100 ) / ( contenido_height - container_height );
				
					// Mostrar scroll					
					mouse_hover(); //wrap.trigger( "mouseover" );
					
					// Mover scroll
					animacion_scroll( moveto.warp, moveto.barra, "", ondrag );
					
					/**** Llamar eventos ****/	
					if( moveto._function == "onTop" && ctrl_top == false ){
						_call( moveto._function );
						ctrl_top = true;
						 
					} else if( moveto._function == "onBottom" && ctrl_bottom == false ){
						_call( moveto._function );
						ctrl_bottom = true;						
					}
					
					// Actualizar valores
					settings.prop.poss = moveto;
				}
				// Retornar objeto
				return moveto;
			},
			
			_goto = function( evt, ele ){
				// Nada que hacer.
				if( contenido.outerHeight() <= wrap.outerHeight() ){ return false; }
				
				// Variables 
				var current_pos = contenido.css( "top" ) == 'auto' ? 1 : ( _int( contenido.css( "top" ) ) * -1 );
								
				// Determinar si la $ es un porcentaje
				if( isPercentage( ele ) ){
					// Variables
					var percent = _int( ele ), new_val,
						// Calcular porcentaje actual.
						percent_current = ( current_pos * 100 ) / ( contenido_height - container_height ),
						// Agregar porcentaje				
						percent_new = _getValueAdd( ele, percent_current );
					
					// Controlar porcentaje 
					percent_new = percent_new ? Math.min( 100, Math.max( 0, ( percent_new < 0 ? ( percent_new * -1 ) : percent_new ) ) ) : percent;
					
					// Calcular valor del nuevo porcentaje
					new_val = ( percent_new * ( contenido_height - container_height ) ) / 100;
					
					// obtener valores
					moveto = _moveTo( new_val );
						
				// Comprobar si la $ es un número
				} else if( _int( ele, true ) ){
					// obtener valores
					moveto = _moveTo( ele );
				
				// Comprobar si es un elemento
				} else if( contenido.find( ele ) && contenido.find( ele ).length > 0 ){
					// Seleccionar elemento
					var _elem = contenido.find( ele ),
						// Posicion
						top = _elem.offset().top - contenido.offset().top;
					
					// obtener valores
					moveto = _moveTo( top - 10 );
				}
			},
						
			animacion_scroll = function( uno, dos, fuc ){
				fuc = fuc != undefined ? fuc : ( arguments[2] != undefined ? arguments[2] : "" );	
				var event_mouse = typeof arguments[3] == "undefined" ? false : true;
				
				if( settings.animate == true && !event_mouse ){
					// Animar elementos.			
					if( _int( uno, true ) )
						contenido.animate({ "top": uno + "px" }, { duration: settings.speed, easing: easing, queue:false });
					if( _int( dos, true ) )
						barrita.animate({"top" : dos + "px" }, { duration: settings.speed, easing: easing, queue:false }); /*step: _step*/
						
				} else {
					// Atualizar posicion de los elementos
					if( _int( uno, true ) )
						contenido.css( { "top" : uno + "px" });
						
					if( _int( dos, true ) )
						barrita.css({ "top" : dos + "px" });					
				}
				// Llamar funcion
				_call( fuc );			
			},
			
			_step = function( now, fx ){
				$( fx.elem ).css( fx.prop, now );
				_debug( arguments, $( fx.elem ).attr('class') );
			},
			
			_call = function( call_fun, evt ){
				// Elementos
				var wraps = {
					wrap_scroll : wrap.get(0),
					warp_content : contenido.get(0),
					barra : barra.get(0),
					barrita : barrita.get(0)
				},
				
				variables = [ wraps, settings, call_fun ],
				duracion = settings.animate == true ? settings.speed : 0;
					
				switch ( call_fun ){
					// Funcion al iniciarse el plugin
					case "init" :
						// Comprobar si es una funcion 
						if( $.isFunction( settings.init ) && init_fn ){ settings.init.apply( self, variables ); init_fn = false }
						
					break;
					// Funcion al subir el scroll
					case "onTop" :
						// Comprobar si es una funcion 
						if( $.isFunction( settings.onTop ) && ctrl_top == false )
						   setTimeout( function(){ settings.onTop.apply( self, variables ); }, duracion ); ctrl_top = true;
						   
					break;
					// Funcion al bajar el scroll
					case "onBottom" :
						// Comprobar si es una funcion 
						if( $.isFunction( settings.onBottom ) && ctrl_bottom == false )
						   setTimeout( function(){ settings.onBottom.apply( self, variables ); }, duracion ); ctrl_bottom = true;
						   
					break;
					// Funcion al actualizarse el plugin
					case "onUpdate" :
						// Comprobar si es una funcion 
						if( $.isFunction( settings.onUpdate ) )
						   setTimeout( function(){ settings.onUpdate.apply( self, variables ); }, duracion);
						   
					break;
					// evt mousewhell.
					case "onScroll" :
						// Comprobar si es una funcion 
						if( $.isFunction( settings.onScroll ) ){
							// Agregar evento
							variables.unshift( evt );							
							// Llamar funcion
							settings.onScroll.apply( self, variables );
						}
												
					break;
				}
				
				return call_fun;
			};
						
			/*** Iniciar el scroll. ****/
			return init();
		});			
	}
	
	// Populate the class2type map
	var class_type = [], toString = Object.prototype.toString,
		type_vars = ["Boolean", "Number", "String", "Function", "Array", "Date", "RegExp", "Object"];
	
	$.each( type_vars, function( i, name ) {
		// Agregar tipo de variable
		class_type[ "[object " + type_vars[ i ] + "]" ] = ( type_vars[ i ] + "" ).toLowerCase();
		
	});
	
	// Determina el tipo de variables...
	$.type = $.type || function( _obj ){
		// Retornar tipo de variable.
		return _obj == null ? String( _obj ) : class_type[ toString.call( _obj ) ] || "object";
	}
	
	$.fn.setOuterHeight = function( value, margins, _save ){
		/*** Verificar selector ***/
		if( !this || this.length == 0 )
			return this;
		
		/*** Is number ***/
		var isNumber = function( Numero ){
			/**** Comprobar se el Numero si es un Número ****/
			return !isNaN( parseFloat( Numero ) );
		}
		
		/*** El valor no es un número ***/
		if( !isNumber( value ) )
			return this;
		
		else
			/*** Convertir a integro ***/ 
			value = parseFloat( value );
			
		/*** Retornar elemento ***/
		return this.each( function( ) {
			/*** Variables ****/
			var elemento = $( this ), Height = 0, prop,
				factores = [ "border-top-width", "padding-top", "padding-bottom", "border-bottom-width" ];
			
			if( margins === true )
				factores.push( "margin-top", "margin-bottom" );
			
			/*** Recorrer propiedades css ***/
			$.each( factores, function( index, val ){
				/*** Aumentar altura ***/
				prop = elemento.css( val );
				Height = Height + ( isNumber( prop ) ? parseFloat( prop ) : 0 );
				
			});
			
			if( ( value - Height ) <= 0 )
				Height = 0;
			
			else
				/** Altura del elemento sin la margin, el borde y el padding ***/
				Height = value - Height;
			
			if( !_save ){
				/*** Establecer altura ***/
				elemento.height( Height );
				
			} else {
				// Guardar valor
				elemento.data( "_outerHeight", Height );
			}
		});
	}
	
})(jQuery);