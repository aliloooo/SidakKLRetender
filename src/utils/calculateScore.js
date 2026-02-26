/**
 * Calculate nilai (score) for each sub_aspek detail row.
 * Business rule: nilai = bobot_sub_aspek if kelengkapan is 'Sesuai'.
 *
 * @param {number} bobot_sub_aspek
 * @param {string} kelengkapan - 'Sesuai' | 'Tidak Sesuai'
 * @returns {number}
 */
export function calcNilaiSubAspek(bobot_sub_aspek, kelengkapan) {
    if (kelengkapan === 'Sesuai') return Number(bobot_sub_aspek)
    return 0
}

/**
 * Sum nilai for a given aspek from detail array.
 * @param {Array} details - array of { aspek_id, nilai }
 * @param {string} aspek_id
 * @returns {number}
 */
export function calcNilaiAspek(details, aspek_id) {
    return details
        .filter((d) => d.aspek_id === aspek_id)
        .reduce((sum, d) => sum + Number(d.nilai), 0)
}

/**
 * Calculate grand total nilai from all details.
 * @param {Array} details
 * @returns {number}
 */
export function calcTotalNilai(details) {
    return details.reduce((sum, d) => sum + Number(d.nilai), 0)
}

/**
 * Determine compliance status.
 * @param {number} totalNilai
 * @returns {'Comply' | 'Not Comply'}
 */
export function determineStatus(totalNilai) {
    return totalNilai >= 80 ? 'Comply' : 'Not Comply'
}
