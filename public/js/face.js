const MODEL_URL = 'public/models'
const video = document.getElementById("video");
const buttonUpload = document.getElementById('inputGroupFileAddon04');

Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
]).then(startWebcam);

function startWebcam() {
    navigator.mediaDevices
        .getUserMedia({
            video: true,
            audio: false,
        })
        .then((stream) => {
            video.srcObject = stream;
        })
        .catch((error) => {
            console.error(error);
        });
}

function getLabeledFaceDescriptions() {
    const labels = ["Rapha"];
    return Promise.all(
        labels.map(async (label) => {
            const descriptions = [];
            for (let i = 1; i <= 2; i++) {
                const img = await faceapi.fetchImage(`images\\Eu1x1.png`);
                const detections = await faceapi
                    .detectSingleFace(img)
                    .withFaceLandmarks()
                    .withFaceDescriptor()
                    .withAgeAndGender();
                descriptions.push(detections.descriptor);
            }
            return new faceapi.LabeledFaceDescriptors(label, descriptions);
        })
    );
}

document.getElementById('inputGroupFileAddon04').addEventListener('click', function () {
    let tgt = document.getElementById('inputGroupFile02'),
        name = document.getElementById('face-name'),
        files = tgt.files;

    if (!name.value) {
        toast("Adicionar face", "O nome deve ser informado", EnumToast.erro);
        return false;
    }

    if (!files.length) {
        toast("Adicionar face", "A imagem deve ser seleciona", EnumToast.erro);
        return false;
    }

    // FileReader support
    if (FileReader && files && files.length) {
        let fr = new FileReader();
        fr.onload = function () {
            let figure = document.createElement('figure'),
                caption = document.createElement('figcaption'),
                img = document.createElement('img');

            img.src = fr.result;
            img.setAttribute("alt", name.value);
            img.dataset.name = name.value;
            img.classList.add("figure-img", "img-fluid", "rounded");

            caption.innerText = name.value;
            caption.classList.add("figure-caption", "text-center");

            figure.classList.add("figure", "figure-face");
            figure.appendChild(img);
            figure.appendChild(caption);

            document.getElementById('card-imagens').appendChild(figure);

            tgt.value= null;
            name.value = '';
            toast("Adicionar face", "Face adicionada com sucesso!", EnumToast.sucesso);
        }
        fr.readAsDataURL(files[0]);
    } else {
        // fallback -- perhaps submit the input to an iframe and temporarily store
        // them on the server until the user's session ends.
    }
});


video.addEventListener("play", async () => {
    const labeledFaceDescriptors = await getLabeledFaceDescriptions();
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors,0.6);

    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);

    const displaySize = { width: video.offsetWidth, height: video.offsetHeight };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        const detections = await faceapi
            .detectAllFaces(video)
            .withFaceLandmarks()
            .withFaceDescriptors()
            .withAgeAndGender();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

        const results = resizedDetections.map((d) => {
            let dadosretorno = faceMatcher.findBestMatch(d.descriptor);
            dadosretorno.age = d.age;
            dadosretorno.gender = d.gender;
            return dadosretorno;
        });
        results.forEach((result, i) => {
            const box = resizedDetections[i].detection.box;
            const drawBox = new faceapi.draw.DrawBox(box, {
                label: result + " Idade: "+ result.age.toFixed() + " - Genero: " + result.gender,
            });
            drawBox.draw(canvas);
        });
    }, 100);
});
