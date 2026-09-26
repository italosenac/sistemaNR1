import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function MensagemDeErro({ mensagem }: { mensagem: string }) {
  return (
    <Alert variant="destructive" className="mt-4 border-red-200 bg-red-50">
      <AlertCircle aria-hidden="true" />
      <AlertDescription>{mensagem}</AlertDescription>
    </Alert>
  );
}
