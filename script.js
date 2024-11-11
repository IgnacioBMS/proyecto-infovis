let chart; // Para mantener referencia al gráfico
let audio = new Audio('audio/audio.mp3'); // Ruta a tu archivo de audio
audio.loop = true; // Hacer que el audio se reproduzca en loop
let isPlaying = false; // Estado para controlar si el audio está en reproducción o pausado
let intervalId; // Para guardar la referencia al intervalo de actualización

document.addEventListener('DOMContentLoaded', function() {
    const carDetails = document.getElementById('car-details'); // Contenedor para los detalles del auto
    const carSpecs = document.getElementById('car-specs'); // Donde se mostrarán las especificaciones
    const toggleVolumeButton = document.getElementById('toggle-volume'); // El botón para activar/desactivar el seguimiento
    const volumeIcon = document.getElementById('volume-icon'); // El ícono dentro del botón
    const categorySelect = document.getElementById('category-select'); // Selector de categoría

    // Cargar el CSV
    Papa.parse('datos/database.csv', {
        download: true,
        header: true,
        complete: function(results) {
            const data = results.data.map(item => {
                return {
                    Name: item.Name,
                    Price: parseInt(item.PriceinEurope),
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

            // Cambiar el gráfico cuando se seleccione una nueva categoría
            categorySelect.addEventListener('change', function() {
                const categoria = categorySelect.value;
                actualizarGrafico(categoria, data);
                pausarAudio(); // Pausar el audio cuando se cambia la categoría
            });
        },
        error: function(err) {
            console.error('Error al cargar el archivo CSV:', err);
        }
    });

    // Función para actualizar el gráfico
    function actualizarGrafico(categoria, data) {
        const precios = data.map(item => item.Price);
        const valores = data.map(item => item[categoria]);

        // Si ya existe un gráfico, destrúyelo antes de crear uno nuevo
        if (chart) {
            chart.destroy();
        }

        // Crear el gráfico
        const ctx = document.getElementById('line-chart').getContext('2d');
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: precios,
                datasets: [{
                    label: categoria,
                    data: valores,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    fill: false,
                    pointBackgroundColor: 'rgba(75, 192, 192, 1)'
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

    // Función para actualizar el gráfico según el tiempo de la canción
    function updateChartLine(limitIndex) {
        const dataset = chart.data.datasets[0];
        dataset.pointBackgroundColor = dataset.data.map((_, index) =>
            index <= limitIndex ? 'rgba(255, 99, 132, 1)' : 'rgba(75, 192, 192, 1)'
        );
        dataset.borderColor = limitIndex === dataset.data.length - 1 
            ? 'rgba(75, 192, 192, 1)' 
            : 'rgba(255, 99, 132, 1)';
        chart.update();
    }

    // Función para pausar el audio y restablecer el botón
    function pausarAudio() {
        audio.pause();
        isPlaying = false;
        volumeIcon.classList.remove('fa-pause');
        volumeIcon.classList.add('fa-play');
        clearInterval(intervalId);
    }

    // Botón de play/pause
    toggleVolumeButton.addEventListener('click', function() {
        if (isPlaying) {
            pausarAudio(); // Usamos la función pausarAudio para mantener consistencia
        } else {
            audio.play();
            isPlaying = true;
            volumeIcon.classList.remove('fa-play');
            volumeIcon.classList.add('fa-pause');
            intervalId = setInterval(() => {
                if (chart) {
                    const audioProgress = audio.currentTime / audio.duration;
                    const limitIndex = Math.floor(audioProgress * chart.data.labels.length);
                    updateChartLine(limitIndex);
                }
            }, 100);
        }
    });
});
