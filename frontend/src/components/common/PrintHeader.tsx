import { useAuthStore } from "@/stores/authStore";

export interface MetaField {
  label: string;
  value: string;
}

interface PrintHeaderProps {
  title: string;
  meta?: MetaField[];
}

export default function PrintHeader({ title, meta = [] }: PrintHeaderProps) {
  const user = useAuthStore((s) => s.user);

  const printDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const printTime = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="hidden print:block mb-4"
      style={{ fontFamily: "Arial, sans-serif", color: "#000" }}
    >
      {/* ── Company Header ── */}
      <div
        style={{
          textAlign: "center",
          borderBottom: "2px solid #000",
          paddingBottom: "10px",
          marginBottom: "8px",
        }}
      >
        <div
          style={{ fontSize: "20px", fontWeight: "bold", letterSpacing: "1px" }}
        >
          RentFlow
        </div>
        <div style={{ fontSize: "11px", marginTop: "2px" }}>
          রেন্ট ম্যানেজমেন্ট সিস্টেম
        </div>
        {user?.full_name && (
          <div style={{ fontSize: "11px", marginTop: "2px", color: "#444" }}>
            মালিক: {user.full_name}
          </div>
        )}
      </div>

      {/* ── Document Title ── */}
      <div
        style={{
          textAlign: "center",
          fontWeight: "bold",
          fontSize: "13px",
          letterSpacing: "0.5px",
          margin: "6px 0",
          textDecoration: "underline",
          textUnderlineOffset: "3px",
        }}
      >
        {title.toUpperCase()}
      </div>

      {/* ── Metadata Grid ── */}
      {meta.length > 0 && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "11px",
            marginTop: "8px",
            border: "1px solid #999",
          }}
        >
          <tbody>
            {/* Print date row always shown */}
            {(() => {
              const allFields: MetaField[] = [
                ...meta,
                {
                  label: "প্রিন্টের তারিখ",
                  value: `${printDate}  ${printTime}`,
                },
              ];

              // Pair fields into rows of 2
              const rows: MetaField[][] = [];
              for (let i = 0; i < allFields.length; i += 2) {
                rows.push(allFields.slice(i, i + 2));
              }

              return rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((field, fi) => (
                    <>
                      <td
                        key={`label-${fi}`}
                        style={{
                          border: "1px solid #999",
                          padding: "3px 6px",
                          fontWeight: "bold",
                          width: "18%",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {field.label}
                      </td>
                      <td
                        key={`value-${fi}`}
                        style={{
                          border: "1px solid #999",
                          padding: "3px 6px",
                          width: fi === 0 ? "32%" : "32%",
                        }}
                      >
                        {field.value}
                      </td>
                    </>
                  ))}
                  {/* Fill empty cell if odd number of fields */}
                  {row.length === 1 && (
                    <>
                      <td
                        style={{
                          border: "1px solid #999",
                          padding: "3px 6px",
                          fontWeight: "bold",
                        }}
                      />
                      <td
                        style={{ border: "1px solid #999", padding: "3px 6px" }}
                      />
                    </>
                  )}
                </tr>
              ));
            })()}
          </tbody>
        </table>
      )}
    </div>
  );
}
