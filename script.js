let chart; // Referencia al gráfico
let audio = new Audio('audio/audio.mp3'); // Ruta al archivo de audio
audio.loop = true; // Se activa el bucle para que el audio se reproduzca continuamente
let isPlaying = false; // Estado para controlar si el audio está en reproducción o pausa
let intervalId; // Para guardar la referencia del intervalo
const velocidadFactor = 0.5; // Factor para ajustar el avance en el gráfico

document.addEventListener('DOMContentLoaded', function () {
    const carDetails = document.getElementById('car-details');
    const carSpecs = document.getElementById('car-specs');
    const toggleVolumeButton = document.getElementById('toggle-volume');
    const volumeIcon = document.getElementById('volume-icon');
    const categorySelect = document.getElementById('category-select');

    // Cargar el CSV
    Papa.parse('datos/database.csv', {
        download: true,
        header: true,
        complete: function (results) {
            const data = results.data.map(item => ({
                Name: item.Name,
                Price: parseInt(item.PriceinEurope),
                Battery_kWh: parseFloat(item.Battery_kWh),
                Acceleration_sec: parseFloat(item.Acceleration_sec),
                TopSpeed_kmh: parseFloat(item.TopSpeed_kmh),
                Range_km: parseFloat(item.Range_km),
                Efficiency_Whkm: parseFloat(item.Efficiency_Whkm),
                NumberofSeats: parseInt(item.NumberofSeats),
                Score: Math.trunc(parseFloat(item.Score) * 100),
            }));

            actualizarGrafico('Score', data);
            mostrarDetallesAuto(data[0]);

            // Evento para cambiar de categoría
            categorySelect.addEventListener('change', function () {
                reiniciarProgreso();
                actualizarGrafico(categorySelect.value, data);
                pausarAudio();
            });
        },
        error: function (err) {
            console.error('Error al cargar el archivo CSV:', err);
        }
    });

    // Función para actualizar el gráfico según la categoría seleccionada
    function actualizarGrafico(categoria, data) {
        const precios = data.map(item => item.Price);
        const valores = data.map(item => item[categoria]);
    
        // Determinar valores mínimo y máximo con límite entre 10 y 100
        const minValor = Math.max(10, Math.min(...valores));
        const maxValor = Math.min(100, Math.max(...valores));
    
        if (chart) {
            chart.destroy();
        }
    
        const ctx = document.getElementById('line-chart').getContext('2d');
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: precios,
                datasets: [
                    {
                        label: 'Progreso del Audio',
                        data: new Array(valores.length).fill(null), // Inicialmente vacía
                        borderColor: 'rgba(255, 99, 132, 1)', // Color de la línea de progreso (roja)
                        borderWidth: 2,
                        fill: false,
                        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                        borderDash: [5, 5] // Línea discontinua para visibilidad
                    },
                    {
                        label: categoria,
                        data: valores,
                        borderColor: 'rgba(75, 192, 192, 1)', // Color original de la categoría
                        borderWidth: 2,
                        fill: false,
                        pointBackgroundColor: 'rgba(75, 192, 192, 1)'
                    }
                ]
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
                        min: minValor - 10,
                        max: maxValor + 10,
                        title: {
                            display: true,
                            text: categoria
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: function (context) {
                                const valor = context[0].raw;
                                return valor ? valor.toFixed(2) : '';
                            },
                            label: function (context) {
                                const index = context.dataIndex;
                                const name = data[index] ? data[index].Name : '';
                                const price = context.label;
                                return `${name}: €${parseFloat(price).toLocaleString()}`;
                            }
                        }
                    }
                },
                onClick: function (e, item) {
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

    // Mostrar detalles del auto
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

    // Control de audio y seguimiento
    toggleVolumeButton.addEventListener('click', function () {
        if (isPlaying) {
            pausarAudio();
            reiniciarProgreso();
        } else {
            reproducirAudio();
        }
    });

    function reproducirAudio() {
        audio.play();
        isPlaying = true;
        volumeIcon.classList.remove('fa-play');
        volumeIcon.classList.add('fa-pause');

        let currentIndex = 0;
        intervalId = setInterval(() => {
            if (chart) {
                const maxValor = Math.max(...chart.data.datasets[1].data); // Tomamos el valor máximo en el eje Y
                console.log(maxValor)
                actualizarProgresoAudio(currentIndex, maxValor);
                currentIndex++;
                if (currentIndex >= chart.data.labels.length) {
                    currentIndex = 0; // Reinicia el progreso
                }
            }
        }, 300); // Actualiza cada 300ms
    }

    function pausarAudio() {
        audio.pause();
        isPlaying = false;
        volumeIcon.classList.remove('fa-pause');
        volumeIcon.classList.add('fa-play');
        clearInterval(intervalId);
    }

    function actualizarProgresoAudio(limitIndex, max_valor) {
        const progressData = chart.data.datasets[0].data; // Datos de la línea de progreso
        const categoryData = chart.data.datasets[1].data; // Datos de la línea de la categoría
        console.log(categoryData)
        const currentValue = categoryData[limitIndex] || 0; // Si es undefined, lo ponemos en 0
        console.log(currentValue)
        const normalizedVolume = Math.min(Math.max(currentValue / max_valor, 0), 1); // Normalizamos el volumen entre 0 y 1
        audio.volume = normalizedVolume; // Ajustar el volumen según el valor actual

        // Oculta la categoría en los puntos que cubre la línea de progreso
        for (let i = 0; i < categoryData.length; i++) {
            if (i <= limitIndex) {
                categoryData[i] = null; // Oculta el punto de la categoría
            } else if (!chart.data.datasets[1].originalData) {
                chart.data.datasets[1].originalData = [...chart.data.datasets[1].data];
            } else {
                categoryData[i] = chart.data.datasets[1].originalData[i]; // Restaura el valor original
            }
        }

        for (let i = 0; i < progressData.length; i++) {
            progressData[i] = i <= limitIndex ? chart.data.datasets[1].originalData[i] : null;
        }

        chart.update();
    }

    function reiniciarProgreso() {
        if (chart) {
            chart.data.datasets[0].data = new Array(chart.data.datasets[1].data.length).fill(null);
            chart.update();
        }
    }
    
});