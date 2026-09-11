# Recibos guardados, envío masivo y asistente Mimi

## Objetivo
Convertir Nómina en un flujo de trabajo seguro: Contabilidad prepara y guarda cada volante, lo revisa, selecciona varios y los envía juntos. Añadir a Mimi como asistente conversacional para preparar borradores y consultar fuentes oficiales dominicanas, sin permitirle aprobar ni enviar pagos por sí sola.

## Qué se construirá

### 1. Bandeja confidencial de volantes
- Guardar cada volante completo como **Borrador**, **Listo**, **Enviando**, **Enviado** o **Error**.
- Mostrar colaborador, período, comprobante, neto, fecha, creador y estado.
- Permitir abrir, editar, duplicar, eliminar borradores y marcar cada uno como listo.
- Mantener el acceso exclusivo de nómina ya asignado a Luis Alonzo Sánchez y Jeannette Mejía.

### 2. Envío masivo seguro
- Seleccionar uno, varios o todos los volantes listos.
- Pedir confirmación antes del envío.
- Generar un PDF IVAD individual para cada colaborador y enviarlo a su propio correo.
- Crear la notificación privada correspondiente dentro del portal.
- Registrar éxito o error por volante; un fallo no detendrá los demás ni se marcará falsamente como enviado.
- Conservar también el envío individual.

### 3. Mimi, asistente de nómina
- Añadir una pestaña **Mimi** dentro del área restringida de Nómina.
- Conversación en español con historial completo de la sesión y respuestas en formato claro.
- Mimi hará preguntas antes de preparar un volante cuando falten período, salario, ingresos, deducciones, firmante u otros datos.
- Podrá proponer cálculos y crear un **borrador**, pero Contabilidad deberá revisarlo y aprobarlo manualmente antes de guardar o enviar.
- Usar un modelo Gemini disponible mediante Lovable AI, con todo el procesamiento sensible en el servidor.

### 4. Fuentes reales y controles
- Dar a Mimi una herramienta de búsqueda web del lado seguro del sistema.
- Priorizar fuentes oficiales dominicanas: DGII, TSS, Ministerio de Trabajo, Poder Judicial y Gaceta Oficial.
- Mostrar enlaces, organismo y fecha de consulta en las respuestas legales o tributarias.
- No tratar la memoria del modelo como fuente vigente; cualquier porcentaje o regla debe citarse o marcarse como pendiente de verificación.
- Mostrar que Mimi apoya a Contabilidad y que la decisión final siempre requiere revisión humana.

### 5. Datos, permisos y auditoría
- Crear una tabla privada para los volantes guardados, con permisos estrictos de nómina y acceso del colaborador únicamente a sus propios volantes enviados.
- Guardar quién creó, modificó y envió cada volante, además de fechas y mensaje de error.
- Validar todos los datos en el servidor y comprobar nuevamente el permiso de nómina antes de guardar, buscar fuentes o enviar.
- Mantener las firmas y los datos salariales fuera de los mensajes visibles de Mimi salvo cuando sean necesarios para el borrador activo.

## Detalles técnicos
- Ampliar el flujo actual de PDF/correo en lugar de duplicarlo.
- El envío masivo se hará de forma secuencial y controlada para respetar límites de correo.
- Mimi usará una ruta de conversación con respuesta progresiva, herramientas de búsqueda y creación de borradores.
- Las fuentes y resultados de herramientas se presentarán dentro del chat; ningún secreto llegará al navegador.
- Se actualizarán los metadatos y tipos generados necesarios para las nuevas pantallas y datos.

## Verificación
- Probar guardado, edición, selección y envío individual/masivo, incluidos correos faltantes y fallos parciales.
- Confirmar que usuarios sin permiso no puedan consultar ni modificar volantes mediante pantalla ni llamadas directas.
- Ejecutar una consulta real de Mimi y comprobar que responda con fuentes enlazadas.
- Revisar la experiencia en escritorio y móvil, errores de consola y compilación final.
