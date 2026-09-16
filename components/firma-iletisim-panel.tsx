"use client";

import { EditableCell } from "@/components/tablolar/editable-cell";
import { updateFirmaField } from "@/lib/actions/firmalar";
import { Panel } from "@/components/ui";

export function FirmaIletisimPanel({
  firmaId,
  adres,
  telefon,
  eposta,
  vergiNo,
}: {
  firmaId: string;
  adres: string | null;
  telefon: string | null;
  eposta: string | null;
  vergiNo: string | null;
}) {
  return (
    <Panel title="İletişim Bilgileri">
      <p className="mb-3 text-[11.5px] text-text-dim">
        Bu bilgiler teklif PDF&apos;inde &quot;Alıcı&quot; olarak görünür — düzenlemek için bir alana çift
        tıklayın.
      </p>
      <div className="grid grid-cols-4 gap-4 text-[13px]">
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-wide text-text-dim">Adres</div>
          <EditableCell
            value={adres ?? ""}
            onSave={(v) => updateFirmaField(firmaId, "adres", v)}
          />
        </div>
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-wide text-text-dim">Telefon</div>
          <EditableCell
            value={telefon ?? ""}
            onSave={(v) => updateFirmaField(firmaId, "telefon", v)}
          />
        </div>
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-wide text-text-dim">E-posta</div>
          <EditableCell
            value={eposta ?? ""}
            onSave={(v) => updateFirmaField(firmaId, "eposta", v)}
          />
        </div>
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-wide text-text-dim">Vergi No</div>
          <EditableCell
            value={vergiNo ?? ""}
            onSave={(v) => updateFirmaField(firmaId, "vergi_no", v)}
          />
        </div>
      </div>
    </Panel>
  );
}
