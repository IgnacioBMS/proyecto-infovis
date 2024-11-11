let chart;  // Para mantener referencia al gráfico
let audio = new Audio('audio/audio.mp3'); // Ruta a tu archivo de audio
let isPlaying = false; // Estado para controlar si el audio está en reproducción o pausado
let intervalId; // Para guardar la referencia al intervalo de actualización
let duration = 30; // Duración total en segundos para recorrer el gráfico
let audioTimeInterval = 0; // Variable para almacenar el tiempo de reproducción del audio
let data; // Almacenamos los datos cargados del CSV

document.addEventListener('DOMContentLoaded', function() {
    const carDetails = document.getElementById('car-details'); // Contenedor para los detalles del auto
    const carSpecs = document.getElementById('car-specs'); // Donde se mostrarán las especificaciones
    const toggleVolumeButton = document.getElementById('toggle-volume'); // El botón para activar/desactivar el seguimiento
    const volumeIcon = document.getElementById('volume-icon'); // El ícono dentro del botón

    let isVolumeTracking = false; // Variable para controlar si el seguimiento de volumen está activado

    // Cargar el CSV
    Papa.parse('datos/database.csv', {
        download: true,
        header: true,
        complete: function(results) {
            data = results.data.map(item => {
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
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const valor = context[0].raw;
                                return valor.toFixed(2);
                            },
                            label: function(context) {
                                const index = context.dataIndex;
                                const name = data[index].Name;
                                const price = context.label;
                                return `${name}: €${parseFloat(price).toLocaleString()}`;
                            }
                        }
                    }
                },
                onClick: function(e, item) {
                    if (item.length > 0) {
                        const index = item[0].index;
                        const car = data[index];
                        carDetails.style.display = 'block';
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
        carDetails.style.display = 'block';
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

    // Función para manejar el botón de play/pause y sincronizar el gráfico con el audio
    toggleVolumeButton.addEventListener('click', function() {
        if (isPlaying) {
            audio.pause();
            volumeIcon.classList.remove('fa-pause');
            volumeIcon.classList.add('fa-play');
            clearInterval(intervalId);
        } else {
            audio.currentTime = 0;
            audio.play();
            volumeIcon.classList.remove('fa-play');
            volumeIcon.classList.add('fa-pause');

            intervalId = setInterval(function() {
                if (audio.paused || audio.ended) {
                    clearInterval(intervalId); // Detener la actualización si el audio se pausa o termina
                } else {
                    audioTimeInterval = audio.currentTime / audio.duration; // Obtener el porcentaje de reproducción

                    // Calcular el índice del gráfico correspondiente según el tiempo del audio
                    const currentIndex = Math.floor(audioTimeInterval * (data.length - 1));

                    // Obtener el valor de la categoría en el índice actual
                    const currentValue = data[currentIndex][document.getElementById('category-select').value];

                    // Ajustar el volumen del audio según el valor del gráfico
                    audio.volume = currentValue / 100; // El volumen varía entre 0 y 1

                    // Actualizar el gráfico con el nuevo valor
                    chart.data.datasets[0].borderColor = `rgba(75, 192, 192, ${audioTimeInterval})`;
                    chart.update();
                }
            }, (duration * 1000) / data.length); // Sincronización del intervalo para cambiar el gráfico
        }

        isPlaying = !isPlaying; // Alternar estado de reproducción
    });
});
