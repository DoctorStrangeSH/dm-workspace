export default function SrdLicensePage() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-6 py-12 text-[var(--text-primary)]">
      <h1 className="text-2xl font-bold">System Reference Document 5.2</h1>
      <p>
        This work includes material taken from the System Reference Document 5.2 (SRD 5.2) by
        Wizards of the Coast LLC, available at{' '}
        <a
          className="underline"
          href="https://dnd.wizards.com/resources/systems-reference-document"
        >
          the official SRD page
        </a>
        . The SRD 5.2 is licensed under the{' '}
        <a className="underline" href="https://creativecommons.org/licenses/by/4.0/legalcode">
          Creative Commons Attribution 4.0 International License
        </a>
        .
      </p>
      <p>
        Magic item data is provided through{' '}
        <a className="underline" href="https://open5e.com/">
          Open5e
        </a>
        . Data fields have been reformatted for this application; descriptions remain in English.
        Missing market prices are left unspecified. No endorsement by Wizards of the Coast is
        implied.
      </p>
    </main>
  )
}
