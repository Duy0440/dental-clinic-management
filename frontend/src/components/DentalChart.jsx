import { useEffect, useMemo, useState } from "react";
import "./DentalChart.css";
import {
  hasMarkedDentalEntries,
  normalizeDentalChartEntries,
} from "../utils/dentalChart";

const arches = [
  {
    label: "Hàm trên",
    left: ["18", "17", "16", "15", "14", "13", "12", "11"],
    right: ["21", "22", "23", "24", "25", "26", "27", "28"],
  },
  {
    label: "Hàm dưới",
    left: ["48", "47", "46", "45", "44", "43", "42", "41"],
    right: ["31", "32", "33", "34", "35", "36", "37", "38"],
  },
];

const conditionOptions = [
  { value: "normal", label: "Bình thường" },
  { value: "caries", label: "Sâu răng" },
  { value: "filled", label: "Đã trám" },
  { value: "root_canal", label: "Đã điều trị tủy" },
  { value: "crown", label: "Răng sứ/mão răng" },
  { value: "implant", label: "Implant" },
  { value: "missing", label: "Mất răng" },
  { value: "extraction_indicated", label: "Chỉ định nhổ" },
  { value: "impacted", label: "Răng mọc ngầm/lệch" },
  { value: "periodontal_issue", label: "Vấn đề nha chu" },
  { value: "other", label: "Tình trạng khác" },
];

const validConditionCodes = new Set(
  conditionOptions.map((condition) => condition.value),
);

const createEmptyDraft = (toothNumber) => ({
  tooth_number: String(toothNumber),
  condition_code: "normal",
  treatment_note: "",
  note: "",
});

function DentalChart({ mode = "view", teeth = [], onChange }) {
  const editable = mode === "edit";
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [draft, setDraft] = useState(null);

  const normalizedTeeth = useMemo(
    () => normalizeDentalChartEntries(teeth),
    [teeth],
  );

  const toothMap = useMemo(() => {
    const map = new Map();

    normalizedTeeth.forEach((tooth) => {
      map.set(tooth.tooth_number, tooth);
    });

    return map;
  }, [normalizedTeeth]);

  useEffect(() => {
    if (!selectedTooth) {
      return;
    }

    setDraft({
      ...createEmptyDraft(selectedTooth),
      ...(toothMap.get(selectedTooth) || {}),
    });
  }, [selectedTooth, toothMap]);

  useEffect(() => {
    if (selectedTooth || !normalizedTeeth.length) {
      return;
    }

    const firstMarkedTooth =
      normalizedTeeth.find(
        (tooth) =>
          tooth.condition_code !== "normal" ||
          tooth.treatment_note ||
          tooth.note,
      ) || normalizedTeeth[0];

    setSelectedTooth(firstMarkedTooth.tooth_number);
  }, [normalizedTeeth, selectedTooth]);

  const getConditionLabel = (conditionCode) => {
    return (
      conditionOptions.find((condition) => condition.value === conditionCode)
        ?.label || "Tình trạng khác"
    );
  };

  const openTooth = (toothNumber) => {
    const normalizedToothNumber = String(toothNumber);

    setSelectedTooth(normalizedToothNumber);
    setDraft({
      ...createEmptyDraft(normalizedToothNumber),
      ...(toothMap.get(normalizedToothNumber) || {}),
    });
  };

  const updateDraft = (field, value) => {
    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        [field]: value,
      };
    });
  };

  const emitChange = (nextTeeth) => {
    if (typeof onChange !== "function") {
      return;
    }

    onChange(normalizeDentalChartEntries(nextTeeth));
  };

  const saveTooth = () => {
    if (!editable || !draft) {
      return;
    }

    const cleanedTooth = {
      tooth_number: String(draft.tooth_number),
      condition_code: validConditionCodes.has(draft.condition_code)
        ? draft.condition_code
        : "other",
      treatment_note: String(draft.treatment_note || "").trim(),
      note: String(draft.note || "").trim(),
    };

    emitChange([
      ...normalizedTeeth.filter(
        (tooth) => tooth.tooth_number !== cleanedTooth.tooth_number,
      ),
      cleanedTooth,
    ]);
    setDraft(cleanedTooth);
  };

  const removeTooth = () => {
    if (!editable || !selectedTooth) {
      return;
    }

    emitChange(
      normalizedTeeth.filter((tooth) => tooth.tooth_number !== selectedTooth),
    );
    setDraft(createEmptyDraft(selectedTooth));
  };

  const renderTooth = (toothNumber) => {
    const entry = toothMap.get(toothNumber);
    const conditionCode = entry?.condition_code || "normal";
    const hasInformation = Boolean(
      entry &&
        (conditionCode !== "normal" || entry.treatment_note || entry.note),
    );
    const isSelected = selectedTooth === toothNumber;

    return (
      <button
        key={toothNumber}
        type="button"
        className={[
          "dental-tooth",
          `condition-${conditionCode}`,
          hasInformation ? "is-marked" : "",
          isSelected ? "is-selected" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => openTooth(toothNumber)}
        aria-label={`Răng ${toothNumber}: ${getConditionLabel(conditionCode)}`}
        aria-pressed={isSelected}
        title={`Răng ${toothNumber} - ${getConditionLabel(conditionCode)}`}
      >
        <svg
          className="dental-tooth-shape"
          viewBox="0 0 32 38"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M16 2c-6.6 0-11 4.7-11 11.1 0 4 1.8 7.4 3.4 10.4 1.2 2.2 1.8 5.2 2.3 7.6.5 2.5 1.1 4.9 3 4.9 1.5 0 1.9-2.4 2.2-4.6.3-2.1.6-4.2 1.1-4.2s.8 2.1 1.1 4.2c.3 2.2.7 4.6 2.2 4.6 1.9 0 2.5-2.4 3-4.9.5-2.4 1.1-5.4 2.3-7.6 1.6-3 3.4-6.4 3.4-10.4C29 6.7 24.6 2 18 2h-2z" />
        </svg>
        <span className="dental-tooth-number">{toothNumber}</span>
        {hasInformation && (
          <span className="dental-tooth-mark" aria-hidden="true">
            ✓
          </span>
        )}
      </button>
    );
  };

  const renderViewPanel = () => (
    <div className="dental-view-fields">
      <div>
        <span>Tình trạng</span>
        <strong>{getConditionLabel(draft.condition_code)}</strong>
      </div>
      <div>
        <span>Nội dung xử lý</span>
        <p>{draft.treatment_note || "Chưa ghi nhận."}</p>
      </div>
      <div>
        <span>Ghi chú</span>
        <p>{draft.note || "Không có ghi chú."}</p>
      </div>
    </div>
  );

  const renderEditPanel = () => (
    <>
      <label className="dental-field">
        <span>Tình trạng răng</span>
        <select
          value={draft.condition_code}
          onChange={(event) => updateDraft("condition_code", event.target.value)}
        >
          {conditionOptions.map((condition) => (
            <option key={condition.value} value={condition.value}>
              {condition.label}
            </option>
          ))}
        </select>
      </label>

      <label className="dental-field">
        <span>Nội dung xử lý</span>
        <textarea
          rows={3}
          value={draft.treatment_note}
          onChange={(event) => updateDraft("treatment_note", event.target.value)}
          placeholder="Ví dụ: Làm sạch xoang sâu, trám tạm..."
        />
      </label>

      <label className="dental-field">
        <span>Ghi chú</span>
        <textarea
          rows={2}
          value={draft.note}
          onChange={(event) => updateDraft("note", event.target.value)}
          placeholder="Nhập ghi chú chuyên môn nếu cần"
        />
      </label>

      <div className="dental-editor-actions">
        <button type="button" className="dental-save-button" onClick={saveTooth}>
          Lưu thông tin răng
        </button>
        <button
          type="button"
          className="dental-remove-button"
          onClick={removeTooth}
        >
          Xóa đánh dấu
        </button>
      </div>
    </>
  );

  return (
    <section className="dental-chart-card">
      <div className="dental-chart-heading">
        <div>
          <span className="dental-chart-eyebrow">Sơ đồ răng điện tử</span>
          <h4>Theo dõi tình trạng từng răng</h4>
        </div>
        <p>
          Chọn vị trí răng theo chuẩn FDI để ghi nhận tình trạng, nội dung xử
          lý và ghi chú chuyên môn.
        </p>
      </div>

      <div className="dental-chart-layout">
        <div className="dental-chart-board">
          <div className="dental-chart-scroll">
            <div className="dental-arch-list">
              {arches.map((arch) => (
                <div className="dental-arch" key={arch.label}>
                  <div className="dental-arch-label">{arch.label}</div>
                  <div className="dental-arch-row">
                    <div className="dental-quadrant">
                      {arch.left.map(renderTooth)}
                    </div>
                    <span className="dental-midline" aria-hidden="true" />
                    <div className="dental-quadrant">
                      {arch.right.map(renderTooth)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dental-chart-legend">
            {conditionOptions.map((condition) => (
              <div className="dental-legend-item" key={condition.value}>
                <span
                  className={`dental-legend-color condition-${condition.value}`}
                  aria-hidden="true"
                />
                <span>{condition.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dental-chart-editor">
          {draft ? (
            <>
              <div className="dental-editor-title">
                <div>
                  <span>Răng {draft.tooth_number}</span>
                  <small>
                    {editable
                      ? "Cập nhật thông tin răng"
                      : "Thông tin đã ghi nhận"}
                  </small>
                </div>
                <strong>{getConditionLabel(draft.condition_code)}</strong>
              </div>
              {editable ? renderEditPanel() : renderViewPanel()}
            </>
          ) : (
            <div className="dental-empty-state">
              <strong>
                {hasMarkedDentalEntries(normalizedTeeth)
                  ? "Chọn răng để xem chi tiết"
                  : "Chưa chọn răng"}
              </strong>
              <p>
                {editable
                  ? "Bấm vào một răng trên sơ đồ để ghi nhận tình trạng, nội dung xử lý và ghi chú."
                  : "Bấm vào một răng trên sơ đồ để xem lại dữ liệu đã lưu trong bệnh án."}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default DentalChart;
