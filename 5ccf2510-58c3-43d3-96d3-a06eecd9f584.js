/* eslint-disable react/prop-types */
// Canvas root — lays out the 6 email templates as DCArtboards.

const { useState, useEffect } = React;

function App() {
  return (
    <DesignCanvas
      title="Studio do Jon · Email System"
      subtitle="Seis templates · um sistema de tipografia · pronto pra plug nos disparos"
    >
      <DCSection
        id="sequencia"
        title="Sequência pós-atendimento"
        subtitle="Disparos automáticos a partir do dia do corte · D+1 a D+90 · bônus de aniversário"
      >
        <DCArtboard id="d1"  label="D+1 · primeira noite"     width={640} height={1380}>
          <EmailD1 />
        </DCArtboard>
        <DCArtboard id="d7"  label="D+7 · uma semana"         width={640} height={1640}>
          <EmailD7 />
        </DCArtboard>
        <DCArtboard id="d21" label="D+21 · o auge · timeline" width={640} height={1640}>
          <EmailD21 />
        </DCArtboard>
        <DCArtboard id="d35" label="D+35 · janela · dark"     width={640} height={1480}>
          <EmailD35 />
        </DCArtboard>
        <DCArtboard id="d60" label="D+60 · ensaio"            width={640} height={1720}>
          <EmailD60 />
        </DCArtboard>
        <DCArtboard id="d90" label="D+90 · até a próxima"     width={640} height={1480}>
          <EmailD90 />
        </DCArtboard>
        <DCArtboard id="aniv" label="Bônus · aniversário"     width={640} height={1340}>
          <EmailAniversario />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="transacionais"
        title="Transacionais"
        subtitle="Disparados automaticamente quando algo acontece na agenda"
      >
        <DCArtboard id="confirmacao" label="01 · Confirmação" width={640} height={1480}>
          <EmailConfirmacao />
        </DCArtboard>
        <DCArtboard id="lembrete" label="02 · Lembrete 24h · dark" width={640} height={1500}>
          <EmailLembrete />
        </DCArtboard>
        <DCArtboard id="poscorte" label="03 · Pós-corte" width={640} height={1500}>
          <EmailPosCorte />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="relacionamento"
        title="Relacionamento"
        subtitle="Feedback, conteúdo e reativação — mais editorial, menos urgente"
      >
        <DCArtboard id="pesquisa" label="04 · Pesquisa + Google review" width={640} height={1480}>
          <EmailPesquisa />
        </DCArtboard>
        <DCArtboard id="newsletter" label="05 · Newsletter mensal" width={640} height={1980}>
          <EmailNewsletter />
        </DCArtboard>
        <DCArtboard id="reativacao" label="06 · Reativação" width={640} height={1500}>
          <EmailReativacao />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
