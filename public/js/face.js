const MODEL_URL = 'public/models'
const video = document.getElementById("video");
const buttonStartSop = document.getElementById('startStop');
const buttonUpload = document.getElementById('inputGroupFileAddon04');
const buttonPhoto = document.getElementById('takePhoto');

buttonPhoto.addEventListener('click',async function (){
    const detections = await faceapi
        .detectAllFaces(video)
        .withFaceLandmarks()
    if(!detections.length){
        toast("Face Api","Sem imagem detectada",EnumToast.erro);
        return false;
    }
    let canvas = document.createElement("canvas");
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    AdicionaFoto(canvas.toDataURL("image/jpeg"),document.getElementById('face-name'),document.getElementById('inputGroupFile02'))
    canvas.remove();
})
buttonStartSop.addEventListener('click', function () {
    if (!document.querySelectorAll('img').length) {
        toast("Face API", "Sem dados de comparação adicionados", EnumToast.informacao)
        return false;
    }
    Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
    ]).then(startWebcam);
})

function startWebcam() {
    if (window?.stream?.getVideoTracks().some(x => x.enabled === true && x.readyState === 'live')) {
        window.stream.getTracks().forEach((track) => {
            track.stop();
        })
        window.stream = null;
        video.srcObject = null;
        buttonUpload.disabled = false;
        AdicionaRemoveEvento(false);
        document.querySelectorAll('canvas').forEach((canvas) => {
            canvas.remove();
        })
        return false;
    }
    navigator.mediaDevices
        .getUserMedia({
            video: true,
            audio: false,
        })
        .then((stream) => {
            window.stream = stream;
            video.srcObject = stream;
            buttonUpload.disabled = true;
            AdicionaRemoveEvento(true)
        })
        .catch((error) => {
            toast("Face API","Sem permissão de acesso a webcam, favor autorizar",EnumToast.informacao)
            console.error(error);
        });
}

function getLabeledFaceDescriptions() {
    const labels = [...document.querySelectorAll('img')].map(x => x.getAttribute('data-name'));
    const imagensComparacao = [...document.querySelectorAll('img')];
    return Promise.all(
        labels.map(async (label, index) => {
            let descriptions = [];
            for (let i = 0; i <= 1; i++) {
                const detections = await faceapi
                    .detectSingleFace(imagensComparacao[index])
                    .withFaceLandmarks()
                    .withFaceDescriptor()
                    .withAgeAndGender();
                descriptions.push(detections?.descriptor);
            }
            descriptions = descriptions.filter(x=> x !== undefined);
            if(!descriptions.length){
                return;
            }
            return new faceapi.LabeledFaceDescriptors(label, descriptions);
        })
    );
}

function AdicionaFoto(fr, name, tgt) {
    let figure = document.createElement('figure'),
        caption = document.createElement('figcaption'),
        img = document.createElement('img'),
        deletar = document.createElement('a');

    deletar.classList.add('remove-image');
    deletar.href = '#!';
    deletar.textContent = 'x';

    img.src = fr;
    img.setAttribute("alt", name.value);
    img.dataset.name = name.value;
    img.classList.add("figure-img", "img-fluid", "rounded");

    caption.innerText = name.value;
    caption.classList.add("figure-caption", "text-center");

    figure.classList.add("figure", "figure-face");
    figure.appendChild(deletar);
    figure.appendChild(img);
    figure.appendChild(caption);


    document.getElementById('card-imagens').appendChild(figure);

    tgt.value = null;
    name.value = '';
    toast("Adicionar face", "Face adicionada com sucesso!", EnumToast.sucesso);
    document.querySelector('p.text-center')?.remove()
    document.querySelectorAll('.remove-image').forEach((elemento) => {
        elemento.addEventListener('click', function () {
            this.parentElement.remove();
        })
    })
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
            AdicionaFoto(fr.result, name, tgt);
        }
        fr.readAsDataURL(files[0]);
    }
});


video.addEventListener("play", async () => {
    let labeledFaceDescriptors = await getLabeledFaceDescriptions();
    labeledFaceDescriptors = labeledFaceDescriptors.filter(x=> x !== undefined)
    if(!labeledFaceDescriptors.length){
        toast("Face API","Sem imagem de rosto detectado para comparação",EnumToast.informacao);
        startWebcam();
        return false;
    }
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);

    const displaySize = {width: video.offsetWidth, height: video.offsetHeight};
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
                label: RetornaPessoa(result) + " Idade: " + result.age.toFixed() + " - Genero: " + RetornaGenero(result.gender),
            });
            drawBox.draw(canvas);
            DestacaPessoa(result._label);
        });
    }, 500);
});

function AdicionaRemoveEvento(adiciona) {
    if (adiciona) {
        document.querySelectorAll('a').forEach((anchor) => {
            anchor.classList.add('bloqueia-delete');
        })
    } else {
        document.querySelectorAll('a').forEach((anchor) => {
            anchor.classList.remove('bloqueia-delete');
        })
    }
}

function RetornaGenero(genero) {
    switch (genero.toLowerCase()) {
        case "male":
            return "Homem";
        case "female":
            return "Mulher";
        default:
            return "Desconhecido";
    }
}

function RetornaPessoa(result) {
    if (result._label === "unknown") {
        result._label = "Desconhecido";
    }

    return result;
}

function DestacaPessoa(nome) {
    let arrayPessoa = document.querySelectorAll('[data-name="'+nome+'"]');
    arrayPessoa.forEach((el) => {
        el.classList.add('animate__animated', 'animate__tada');
        el.addEventListener('animationend', () => {
            el.classList.remove('animate__animated', 'animate__tada');
        });
    })
}