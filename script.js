let chart; // Referencia al gráfico
let audio = new Audio('audio/audio.mp3'); // Ruta al archivo de audio
audio.loop = true; // Se activa el bucle para que el audio se reproduzca continuamente
let isPlaying = false; // Estado para controlar si el audio está en reproducción o pausa
let intervalId; // Para guardar la referencia del intervalo
const velocidadFactor = 0.5; // Factor para ajustar el avance en el gráfico

let port; // Variable para almacenar la conexión al puerto serie
let writer; // Variable para escribir datos al puerto serie

document.addEventListener('DOMContentLoaded', function () {
    const carDetails = document.getElementById('car-details');
    const carSpecs = document.getElementById('car-specs');
    const toggleVolumeButton = document.getElementById('toggle-volume');
    const volumeIcon = document.getElementById('volume-icon');
    const categorySelect = document.getElementById('category-select');
    const connectButton = document.getElementById('connect-button');

    // Cargar el CSV
    Papa.parse('datos/database.csv', {
        download: true,
        header: true,
        complete: function (results) {
            const data = results.data.map(item => ({
                Name: item.Name,
                Price: parseInt(item.PriceinEurope),
                TopSpeed_kmh: parseFloat(item.TopSpeed_kmh),
                Range_km: parseFloat(item.Range_km),
                Efficiency_Whkm: parseFloat(item.Efficiency_Whkm),
                Score: Math.trunc(parseFloat(item.Score) * 100),
            }));

            if (data.length > 0) {
                actualizarGrafico('Score', data);
                mostrarDetallesAuto(data[0]);
            }

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

    // Función para conectar con el Arduino usando la Web Serial API
    connectButton.addEventListener('click', async () => {
        try {
            port = await navigator.serial.requestPort();
            await port.open({ baudRate: 9600 });

            // Habilita el botón para enviar comandos
            writer = port.writable.getWriter();
            console.log('Conectado al Arduino');
        } catch (err) {
            console.error('Error al conectar con Arduino:', err);
        }
    });

    // Función para actualizar el gráfico según la categoría seleccionada
    function actualizarGrafico(categoria, data) {
        console.log('Creando gráfico para categoría:', categoria);
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
                        mostrarDetallesAuto(car)
                        // Mover el servo según el punto seleccionado en el gráfico
                        const servoPosition = mapToServoRange(data, car.TopSpeed_kmh); // Mapea el precio del auto a un rango de 0 a 500
                        sendToArduino(servoPosition);
                    }
                }
            }
        });
    }

    // Función para mapear el precio a un valor de 0 a 500
    function mapToServoRange(data, velocidad) {
        const validSpeeds = data.map(item => parseFloat(item.TopSpeed_kmh)).filter(speed => !isNaN(speed));
        const minSpeed = Math.min(...validSpeeds);
        const maxSpeed = Math.max(...validSpeeds);

        // Mapeamos el precio a un rango de 0 a 500 para el servo
        return Math.floor(((velocidad - minSpeed) / (maxSpeed - minSpeed)) * 500);
        
    }

    // Función para enviar el valor del servo al Arduino
    async function sendToArduino(value) {
        if (writer) {
            const encoder = new TextEncoder();
            const data = encoder.encode(`PIN 6 ${value}\n`);
            await writer.write(data);
            console.log('Valor enviado al Arduino:', value);
        } else {
            console.error('No hay conexión con el Arduino.');
        }
        setTimeout(() => {
            console.log('Tiempo de envío de datos al Arduino finalizado');
            sendToArduino(0)
        }, 10000); // 30 segundos = 30000 ms
    }

    // Mostrar detalles del auto
    function mostrarDetallesAuto(car) {
        carDetails.style.display = 'block';
        carSpecs.innerHTML = `
            <strong>Nombre:</strong> ${car.Name}<br>
            <strong>Precio:</strong> €${car.Price.toLocaleString()}<br>
            <strong>Velocidad Máxima:</strong> ${car.TopSpeed_kmh} km/h<br>
            <strong>Autonomía:</strong> ${car.Range_km} km<br>
            <strong>Gasto:</strong> ${car.Efficiency_Whkm} Wh/km<br>
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
                const totalPoints = chart.data.labels.length;
                actualizarProgresoAudio(currentIndex);
                ajustarVolumen(currentIndex / totalPoints);
                currentIndex++;
                if (currentIndex >= totalPoints) {
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

    function actualizarProgresoAudio(limitIndex) {
        const progressData = chart.data.datasets[0].data; // Datos de la línea de progreso
        const categoryData = chart.data.datasets[1].data; // Datos de la línea de la categoría

        // Oculta la categoría en los puntos que cubre la línea de progreso
        for (let i = 0; i < categoryData.length; i++) {
            if (i <= limitIndex) {
                progressData[i] = categoryData[i]; // Sincroniza la línea de progreso con la categoría
            } else {
                progressData[i] = null; // Restaura la línea de progreso
            }
        }

        chart.update();
    }

    function reiniciarProgreso() {
        if (chart) {
            chart.data.datasets[0].data = new Array(chart.data.datasets[1].data.length).fill(null);
            chart.update();
        }
    }

    function ajustarVolumen(progress) {
        audio.volume = progress; // Volumen aumenta de 0 a 1 según el progreso en el gráfico
    }
});
