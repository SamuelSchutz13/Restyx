import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Hint, Section } from '@/components/kit';
import { useT } from '../lib/i18n';

const FORMATS = [
  { id: 'json', label: 'JSON', hint: 'a coleção e os ambientes, no formato do .restyx.json' },
  { id: 'curl', label: 'cURL', hint: 'um comando por requisição, com o ambiente ativo aplicado' },
];

export function Export() {
  const t = useT();
  const [format, setFormat] = useState('json');
  const [secrets, setSecrets] = useState(false);
  const href = `/api/export?format=${format}&includeSecrets=${secrets ? 1 : 0}`;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Hint>{t('O arquivo é baixado pelo navegador; nada é enviado para fora desta máquina.')}</Hint>
      <div className="rounded-md border bg-surface">
        <Section title={t('Formato')}>
          <RadioGroup value={format} onValueChange={setFormat} className="gap-2">
            {FORMATS.map((f) => (
              <label key={f.id} className="flex cursor-pointer items-start gap-3 rounded-md border border-l-[3px] border-node-border bg-node p-3 has-[:checked]:border-l-primary">
                <RadioGroupItem value={f.id} className="mt-0.5" />
                <span>
                  <span className="block text-[13px] font-medium">{f.label}</span>
                  <span className="block text-xs text-muted-foreground">{t(f.hint)}</span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </Section>
        <Section title={t('Segredos')}>
          <label className="flex items-start gap-3 text-[13px]">
            <Checkbox checked={secrets} onCheckedChange={(v) => setSecrets(v === true)} className="mt-0.5" />
            <span>
              {t('Incluir valores de variáveis secretas')}
              <span className="block text-xs text-muted-foreground">{t('Por padrão, segredos ficam de fora: no JSON aparecem vazios e no cURL como {{nome}}.')}</span>
            </span>
          </label>
        </Section>
        <div className="px-3 py-3">
          <Button asChild>
            <a href={href} download>
              <Download className="size-4" /> {t('Baixar')}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
