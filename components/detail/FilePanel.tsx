import { Blueprint } from "@/components/inbox/Blueprint";
import { Kicker } from "@/components/ui/Kicker";

export interface ConfirmField {
  label: string;
  value: string;
}

export type FileStage = "idle" | "filing" | "failed" | "filed";

interface FilePanelProps {
  fields: readonly ConfirmField[];
  fileLabel: string;
  stage: FileStage;
  filedRef: string | null;
  onFile: () => void;
}

export function FilePanel({
  fields,
  fileLabel,
  stage,
  filedRef,
  onFile,
}: FilePanelProps) {
  return (
    <section aria-labelledby="file-heading">
      <Blueprint className="p-[var(--space-6)]">
        <Kicker as="h2" id="file-heading" className="mb-[var(--space-4)]">
          Check these before you file
        </Kicker>

        <div className="grid gap-[var(--space-4)]">
          {fields.map((field) => (
            <div key={field.label} className="field">
              <label
                htmlFor={`confirm-${field.label}`}
                className="text-[11px] tracking-[0.1em] uppercase opacity-55"
              >
                {field.label}
              </label>
              <input
                id={`confirm-${field.label}`}
                className="input numerals"
                value={field.value}
                readOnly
              />
            </div>
          ))}
        </div>

        <p className="mt-[var(--space-3)] text-[11.5px] opacity-50 [text-wrap:pretty]">
          Read off the page, not typed in. Correcting a field by hand is the next thing
          being built.
        </p>

        {filedRef !== null ? (
          <p className="mt-[var(--space-6)] text-[12.5px]">
            Already filed. Reference{" "}
            <span className="numerals font-semibold">{filedRef}</span>.
          </p>
        ) : stage === "filing" ? (
          <p className="btn btn-primary btn-block mt-[var(--space-6)] animate-pulse">
            Sending
          </p>
        ) : stage === "failed" ? (
          <div className="mt-[var(--space-6)] border border-stamp p-[var(--space-4)]">
            <p className="text-[13px] font-semibold text-stamp">
              The portal did not accept it
            </p>
            <p className="mt-0.5 text-[12px] opacity-65">
              Nothing was filed. Your reply is still here. Try again.
            </p>
            <button
              type="button"
              onClick={onFile}
              className="btn btn-primary btn-block mt-[var(--space-4)]"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={onFile}
              className="btn btn-primary btn-block mt-[var(--space-6)]"
            >
              {fileLabel}
            </button>
            <p className="mt-2 text-center text-[11.5px] opacity-50">
              The filing endpoint is a mock for this demo. Everything up to it is real.
            </p>
          </>
        )}
      </Blueprint>
    </section>
  );
}
