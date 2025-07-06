import * as XLSX from 'xlsx';
import { Fields, ProductRow } from '../types';

type dataProcessingFunction = (row: Record<string, string>) => ProductRow;

function isRowValid(row: ProductRow, requiredField = [Fields.ArticleNumber, Fields.GTIN, Fields.ListingPrice, Fields.ProductName]): boolean {
    for (const field of requiredField) {
        if (!row[field] || (typeof row[field] === 'string' && row[field].trim() === '')) {
            return false
        }
    }
    return true;
}

const trimAndClean: dataProcessingFunction = (row) => {
    const cleanedRow: ProductRow = { ...row } as ProductRow;
    for (const key of Object.keys(cleanedRow) as Array<keyof ProductRow>) {
        if (typeof cleanedRow[key] === 'string') {
            // Step 1: Trim the string
            let value = cleanedRow[key].trim();
            // Step 2: Remove invalid characters
            // I was not sure what characters to remove, so I went with ASCII printable characters
            // and some German special characters
            value = value.replace(/[^\x20-\x7EÄÖÜäöüß]/g, '');
            // Step 3: Remove any HTML tags
            value = value.replace(/<[^>]*>/g, '');
            cleanedRow[key] = value;
        }
    }
    return cleanedRow;
};

const mergeRepeatedFields: dataProcessingFunction = (row) => {
    const processingRows: Record<string, string[]> = {};

    // Group values by their base field name (e.g., "Field_1", "Field_2" -> "Field")
    for (const key of Object.keys(row)) {
        // Remove trailing _number if present
        const baseKey = key.replace(/_\d+$/, '');

        // Initialize the array for this base key if it doesn't exist
        if (!processingRows[baseKey]) {
            processingRows[baseKey] = [];
        }

        // Add the value to the corresponding base key array
        const value = typeof row[key] === 'string' ? row[key].trim() : row[key];
        if (value) {
            processingRows[baseKey].push(value);
        }
    }

    // Merge grouped values into a single string, separated by commas
    const finalRow: ProductRow = {} as ProductRow;
    for (const baseKey of Object.keys(processingRows)) {
        const finalValue = processingRows[baseKey].length > 0 ? processingRows[baseKey].join(', ') : processingRows[baseKey][0];
        finalRow[baseKey as keyof ProductRow] = finalValue;
    }

    return finalRow;
}

export async function processXlsxFile(
    buffer: Buffer,
    sheetName = 'Produktkatalog',
    proccesingFunctions = [trimAndClean, mergeRepeatedFields]
): Promise<ProductRow[]> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    if (!workbook.Sheets[sheetName]) {
        throw new Error(`Sheet "${sheetName}" not found`);
    }
    const rawRows: ProductRow[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
    const validRows: ProductRow[] = [];

    for (const rawRow of rawRows) {
        try {
            if (!isRowValid(rawRow)) {
                continue;
            }
            let inProgressRow = { ...rawRow } as ProductRow;
            for (const processingFunction of proccesingFunctions) {
                inProgressRow = processingFunction(inProgressRow);
            }
            validRows.push(inProgressRow);
        } catch (error) {
            console.error('Error processing row:', rawRow, error);
            continue;
        }
    }

    return validRows;
}