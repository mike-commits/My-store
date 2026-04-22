import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

interface PDFReportData {
    stats: any;
    manualReports: any[];
    payments: any[];
    sales: any[];
    shipments: any[];
    expenses: any[];
}

export const generatePerformancePDF = async (data: PDFReportData) => {
    const { stats, manualReports, payments, sales, shipments, expenses } = data;
    
    try {
        const html = `
            <html>
            <head>
                <style>
                    body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #111827; }
                    .header { text-align: center; margin-bottom: 50px; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; }
                    h1 { color: #4F46E5; margin-bottom: 5px; }
                    .date { color: #6B7280; font-size: 14px; }
                    
                    .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 40px; }
                    .summary-box { background: #F9FAFB; padding: 15px; border-radius: 10px; border: 1px solid #E5E7EB; }
                    .summary-label { font-size: 12px; color: #6B7280; text-transform: uppercase; font-weight: bold; }
                    .summary-value { font-size: 18px; font-weight: bold; margin-top: 5px; }
                    
                    section { margin-bottom: 40px; }
                    h2 { border-left: 4px solid #4F46E5; padding-left: 10px; font-size: 18px; margin-bottom: 15px; }
                    
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th { background: #F3F4F6; text-align: left; padding: 10px; font-size: 12px; border-bottom: 1px solid #E5E7EB; }
                    td { padding: 10px; font-size: 12px; border-bottom: 1px solid #F3F4F6; }
                    
                    .profit-pos { color: #10B981; font-weight: bold; }
                    .manual-report { background: #FDFCF4; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #FDE68A; }
                    footer { text-align: center; margin-top: 50px; color: #9CA3AF; font-size: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>BUSINESS PERFORMANCE REPORT</h1>
                    <div class="date">Generated on ${new Date().toLocaleString()}</div>
                </div>

                <div class="summary-grid">
                    <div class="summary-box">
                        <div class="summary-label">Net Profit</div>
                        <div class="summary-value profit-pos">SSP ${stats.netProfit.toLocaleString()}</div>
                    </div>
                    <div class="summary-box">
                        <div class="summary-label">Net Sales Revenue</div>
                        <div class="summary-value">SSP ${stats.netSalesRevenue.toLocaleString()}</div>
                    </div>
                    <div class="summary-box">
                        <div class="summary-label">Personal Expenses</div>
                        <div class="summary-value" style="color: #EF4444">SSP ${stats.totalExpenses.toLocaleString()}</div>
                    </div>
                    <div class="summary-box">
                        <div class="summary-label">Inventory Assets</div>
                        <div class="summary-value">SSP ${stats.totalInventoryValue.toLocaleString()}</div>
                    </div>
                </div>

                <section>
                    <h2>Personal Expenses Detail</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${expenses.map(e => `
                                <tr>
                                    <td>${new Date(e.date).toLocaleDateString()}</td>
                                    <td>${e.description}</td>
                                    <td>SSP ${e.amount.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                            ${shipments.filter(sh => (sh.shipping_cost || 0) > 0).map(sh => `
                                <tr>
                                    <td>${new Date(sh.date).toLocaleDateString()}</td>
                                    <td>Shipment Cost: ${sh.description || 'Logistics'}</td>
                                    <td>SSP ${sh.shipping_cost?.toLocaleString() || 0}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </section>

                <section>
                    <h2>Manual Business Journals</h2>
                    ${manualReports.length > 0 ? manualReports.map(mr => `
                        <div class="manual-report">
                            <strong>${mr.title}</strong> - ${new Date(mr.date).toLocaleDateString()}<br/>
                            <p>${mr.content}</p>
                        </div>
                    `).join('') : '<p>No manual journals recorded.</p>'}
                </section>

                <section>
                    <h2>Money Received History</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${payments.map(p => `
                                <tr>
                                    <td>${new Date(p.date).toLocaleDateString()}</td>
                                    <td>SSP ${p.amount.toLocaleString()}</td>
                                    <td>${p.notes}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </section>

                <section>
                    <h2>Sales & Logistics Detail</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Details</th>
                                <th>Amount/Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sales.map(s => `
                                <tr>
                                    <td>${new Date(s.date).toLocaleDateString()}</td>
                                    <td>SALE</td>
                                    <td>${s.product_name} (${s.quantity} units)</td>
                                    <td>SSP ${(s.quantity * s.sell_price).toFixed(0)}</td>
                                </tr>
                            `).join('')}
                            ${shipments.map(sh => `
                                <tr>
                                    <td>${new Date(sh.date).toLocaleDateString()}</td>
                                    <td>SHIPMENT</td>
                                    <td>${sh.description || 'Inventory Stock'} (${sh.weight_kg || 0}kg)</td>
                                    <td>SSP ${sh.shipping_cost?.toFixed(0) || 0}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </section>

                <footer>
                    Store Performance Audit. All manual journals, money records, and shipping costs included.
                </footer>
            </body>
            </html>
        `;

        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
        Alert.alert('Export Failed', 'An error occurred while generating the PDF.');
    }
};
