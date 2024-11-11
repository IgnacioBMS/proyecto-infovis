let chart;  // Para mantener referencia al gráfico
let audio = new Audio('audio/tu-archivo.mp3'); // Ruta a tu archivo de audio
audio.loop = true; // Si quieres que el audio se repita

document.addEventListener('DOMContentLoaded', function() {
    const carDetails = document.getElementById('car-details'); // Contenedor para los detalles del auto
    const carSpecs = document.getElementById('car-specs'); // Donde se mostrarán las especificaciones
    const toggleVolumeButton = document.getElementById('toggle-volume'); // El botón para activar/desactivar el seguimiento
    const volumeIcon = document.getElementById('volume-icon'); // El ícono dentro del botón

    let isVolumeTracking = false; // Variable para controlar si el seguimiento de volumen está activado
    let intervalId; // Para guardar la referencia al intervalo de actualización

    // Cargar el CSV
    Papa.parse('datos/database.csv', {
        download: true,
        header: true,
        complete: function(results) {
            const data = results.data.map(item => {
                return {
                    Name: item.Name,
                    Price: parseInt(item.PriceinEurope), // Convertir a número
                    Battery_kWh: parseFloat(item.Battery_kWh),
                    Acceleration_sec: parseFloat(item.Acceleration_sec),
                    TopSpeed_kmh: parseFloat(item.TopSpeed_kmh),
                    Range_km: parseFloat(item.Range_km),
                    Efficiency_Whkm: parseFloat(item.Efficiency_Whkm),
                    NumberofSeats: parseInt(item.NumberofSeats),
                    Score: Math.trunc(parseFloat(item.Score) * 100),
                };
            });

            // Inicializar el gráfico con la categoría por defecto
            actualizarGrafico('Score', data);
            mostrarDetallesAuto(data[0]);

            // Agregar un evento para cambiar el gráfico cuando se seleccione una nueva categoría
            const categorySelect = document.getElementById('category-select');
            categorySelect.addEventListener('change', function() {
                const categoria = categorySelect.value;
                actualizarGrafico(categoria, data); // Actualiza el gráfico con la nueva categoría seleccionada
            });
        },
        error: function(err) {
            console.error('Error al cargar el archivo CSV:', err);
        }
    });

    // Función para actualizar el gráfico según la categoría seleccionada
    function actualizarGrafico(categoria, data) {
        const precios = data.map(item => item.Price); // Obtiene los precios
        const valores = data.map(item => item[categoria]); // Obtiene los valores de la categoría seleccionada

        // Si ya existe un gráfico, destrúyelo antes de crear uno nuevo
        if (chart) {
            chart.destroy();
        }

        // Crear el gráfico
        const ctx = document.getElementById('line-chart').getContext('2d');
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: precios, // Usar los precios de los autos en el eje X
                datasets: [{
                    label: categoria,
                    data: valores, // Datos de la categoría en el eje Y
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    fill: false,
                    hoverBackgroundColor: 'rgba(255, 99, 132, 0.2)',
                    hoverBorderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)', // Color de fondo para los puntos
                    pointBackgroundColor: 'rgba(75, 192, 192, 1)' // Color de los puntos
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Precio en Europa'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: categoria
                        }
                    }
                },
                // Personalización del tooltip para mostrar el nombre del auto y el precio
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const valor = context[0].raw; // Obtener el valor del eje Y
                                return valor.toFixed(2); // Muestra el valor del eje Y como título
                            },
                            label: function(context) {
                                const index = context.dataIndex;
                                const name = data[index].Name; // Obtener el nombre del auto
                                const price = context.label; // Obtener el precio (eje X)
                                return `${name}: €${parseFloat(price).toLocaleString()}`;
                            }
                        }
                    }
                },
                // Al hacer clic en un punto del gráfico, mostrar los detalles del auto
                onClick: function(e, item) {
                    if (item.length > 0) {
                        const index = item[0].index; // Obtener el índice del auto
                        const car = data[index]; // Obtener los datos del auto

                        // Mostrar las especificaciones del auto
                        carDetails.style.display = 'block'; // Hacer visible el contenedor
                        carSpecs.innerHTML = `
                            <strong>Nombre:</strong> ${car.Name}<br>
                            <strong>Precio:</strong> €${car.Price.toLocaleString()}<br>
                            <strong>Batería:</strong> ${car.Battery_kWh} kWh<br>
                            <strong>Aceleración:</strong> ${car.Acceleration_sec} segundos<br>
                            <strong>Velocidad Máxima:</strong> ${car.TopSpeed_kmh} km/h<br>
                            <strong>Autonomía:</strong> ${car.Range_km} km<br>
                            <strong>Gasto:</strong> ${car.Efficiency_Whkm} Wh/km<br>
                            <strong>Número de Asientos:</strong> ${car.NumberofSeats}<br>
                            <strong>Puntuación:</strong> ${car.Score} / 100<br>
                        `;
                    }
                }
            }
        });
    }

    // Función para mostrar los detalles del auto
    function mostrarDetallesAuto(car) {
        carDetails.style.display = 'block'; // Hacer visible el contenedor
        carSpecs.innerHTML = `
            <strong>Nombre:</strong> ${car.Name}<br>
            <strong>Precio:</strong> €${car.Price.toLocaleString()}<br>
            <strong>Batería:</strong> ${car.Battery_kWh} kWh<br>
            <strong>Aceleración:</strong> ${car.Acceleration_sec} segundos<br>
            <strong>Velocidad Máxima:</strong> ${car.TopSpeed_kmh} km/h<br>
            <strong>Autonomía:</strong> ${car.Range_km} km<br>
            <strong>Gasto:</strong> ${car.Efficiency_Whkm} Wh/km<br>
            <strong>Número de Asientos:</strong> ${car.NumberofSeats}<br>
            <strong>Puntuación:</strong> ${car.Score} / 100<br>
        `;
    }

    // Iniciar audio
    audio.play();

    // Función para manejar el botón de play/pause y seguimiento de volumen
    toggleVolumeButton.addEventListener('click', function() {
        isVolumeTracking = !isVolumeTracking; // Alternar el estado del seguimiento

        // Cambiar el ícono del botón según el estado
        if (isVolumeTracking) {
            volumeIcon.classList.remove('fa-play');
            volumeIcon.classList.add('fa-pause'); // Cambiar el ícono a "pause"

            // Iniciar el intervalo para actualizar el volumen continuamente
            intervalId = setInterval(function() {
                if (chart) {
                    const currentIndex = chart.tooltip._active[0].dataIndex; // Obtener el índice del punto seleccionado en el gráfico
                    if (currentIndex !== undefined) {
                        const yValue = chart.data.datasets[0].data[currentIndex]; // Obtener el valor del eje Y
                        const volume = Math.min(Math.max(yValue / 100, 0), 1); // Mapeo de 0 a 1
                        audio.volume = volume; // Ajusta el volumen del audio
                    }
                }

                // Actualizar la línea del gráfico hasta el punto donde se está reproduciendo el sonido
                const audioTimePercentage = audio.currentTime / audio.duration; // Porcentaje de la canción reproducida
                const limitIndex = Math.floor(audioTimePercentage * chart.data.labels.length); // Índice hasta donde cambiar el color
                updateChartLine(limitIndex); // Actualizar la línea del gráfico
            }, 100); // Actualiza cada 100ms
        } else {
            volumeIcon.classList.remove('fa-pause');
            volumeIcon.classList.add('fa-play'); // Cambiar el ícono a "play"

            // Detener el seguimiento de volumen
            clearInterval(intervalId);
        }
    });

    // Función para cambiar el color de la línea en el gráfico
    function updateChartLine(limitIndex) {
        const originalData = chart.data.datasets[0].data;
        const updatedData = originalData.slice(); // Copiar los datos

        // Cambiar el color de la línea hasta el índice correspondiente
        for (let i = 0; i < limitIndex; i++) {
            chart.data.datasets[0].backgroundColor = 'rgba(255, 99, 132, 0.2)'; // Cambiar color de los puntos
            chart.data.datasets[0].borderColor = 'rgba(255, 99, 132, 1)'; // Cambiar color de la línea
        }

        // Volver a pintar el gráfico con el color actualizado
        chart.update();
    }
});
