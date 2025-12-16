function renderCertifications(certs) {
  const container = document.querySelector('#certifications .box-container');
  let html = '';
  certs.forEach(cert => {
    html += `
    <div class="box tilt">
      <img draggable="false" src="/assets/images/certifications/${cert.image}.png" alt="certification" />
      <div class="content">
        <div class="tag">
          <h3>${cert.name}</h3>
        </div>
        <div class="desc">
          <p><strong>Issuer:</strong> ${cert.issuer}</p>
          <p><strong>Issued:</strong> ${cert.issued}${cert.expires ? ` · <strong>Expires:</strong> ${cert.expires}` : ''}</p>
          ${cert.credentialId ? `<p class="credential-id"><strong>Credential ID:</strong> ${cert.credentialId}</p>` : ''}
          <p>${cert.desc}</p>
          <div class="btns">
            <a href="${cert.links.credential}" class="btn" target="_blank"><i class="fas fa-link"></i> Show credential</a>
          </div>
        </div>
      </div>
    </div>`;
  });
  container.innerHTML = html;

  VanillaTilt.init(document.querySelectorAll('#certifications .tilt'), { max: 15 });

  const srtop = ScrollReveal({ origin: 'top', distance: '80px', duration: 1000, reset: true });
  srtop.reveal('#certifications .box', { interval: 200 });
}

fetch('../certifications/certifications.json')
  .then(r => r.json())
  .then(renderCertifications);
