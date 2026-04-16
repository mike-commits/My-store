import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, TextInput, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../domain/useStore';
import { Theme } from '../../core/theme';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { FormLayout } from '../components/FormLayout';
import { generatePerformancePDF } from '../../core/utils/pdfGenerator';
import { useAppTheme } from '../../core/contexts/ThemeContext';

export function ReportsScreen() {
    const { manualReports, payments, expenses, stats, refreshAll, addPayment, addManualReport, deleteManualReport, addExpense, deleteExpense } = useStore();
    const { colors, isDark } = useAppTheme();

    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [expenseModalVisible, setExpenseModalVisible] = useState(false);
    
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');

    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseDescription, setExpenseDescription] = useState('');
    
    const [reportTitle, setReportTitle] = useState('');
    const [reportContent, setReportContent] = useState('');

    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

    const totalPaymentsReceived = payments.reduce((sum, p) => sum + p.amount, 0);
    const outstandingBalance = stats.totalSalesRevenue - totalPaymentsReceived;

    const generatePDF = () => {
        generatePerformancePDF({ stats, manualReports, payments, sales: [], shipments: [], expenses });
    };

    const handleSavePayment = async () => {
        if (!amount) return;
        try {
            await addPayment(parseFloat(amount), new Date().toISOString(), notes);
            setPaymentModalVisible(false);
            setAmount('');
            setNotes('');
        } catch (e) { Alert.alert('Error', 'Failed to save record'); }
    };

    const handleSaveReport = async () => {
        if (!reportTitle || !reportContent) return;
        try {
            await addManualReport(reportTitle, reportContent);
            setReportModalVisible(false);
            setReportTitle('');
            setReportContent('');
        } catch (e) { Alert.alert('Error', 'Failed to save journal'); }
    };

    const handleSaveExpense = async () => {
        if (!expenseAmount || !expenseDescription) return;
        try {
            await addExpense(parseFloat(expenseAmount), expenseDescription);
            setExpenseModalVisible(false);
            setExpenseAmount('');
            setExpenseDescription('');
        } catch (e) { Alert.alert('Error', 'Failed to save expense'); }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.headerAccent, { color: colors.primary }]}>BUSINESS JOURNAL</Text>
                        <Text style={[styles.title, { color: colors.text }]}>Reports & Logs</Text>
                    </View>
                    <TouchableOpacity onPress={generatePDF} style={[styles.pdfBtn, { backgroundColor: isDark ? colors.primaryLight : '#F3E8FF', borderColor: colors.primary }]}>
                        <Text style={[styles.pdfBtnText, { color: colors.primary }]}>EXPORT PDF</Text>
                    </TouchableOpacity>
                </View>

                {/* Summary Card */}
                <Card style={[styles.mainCard, { backgroundColor: colors.primary }]}>
                    <Text style={styles.cardLabel}>Portfolio Net Profit</Text>
                    <Text style={styles.profitText}>SSP {stats.netProfit.toLocaleString()}</Text>
                    <View style={styles.divider} />
                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Text style={styles.statLabel}>Total Cash In</Text>
                            <Text style={styles.statValue}>SSP {totalPaymentsReceived.toLocaleString()}</Text>
                        </View>
                        <View style={styles.stat}>
                            <Text style={styles.statLabel}>Balance Due</Text>
                            <Text style={[styles.statValue, { color: outstandingBalance > 0 ? '#FEF08A' : '#FFFFFF' }]}>
                                SSP {outstandingBalance.toLocaleString()}
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Quick Addition Section */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Manual Entry Tools</Text>
                <View style={styles.toolRow}>
                    <TouchableOpacity style={[styles.toolBtn, { backgroundColor: isDark ? colors.surface : '#EEF2FF', borderColor: isDark ? colors.primary : '#F3F4F6' }]} onPress={() => setPaymentModalVisible(true)}>
                        <Text style={styles.toolIcon}>💰</Text>
                        <Text style={[styles.toolText, { color: colors.text }]}>Record Money</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.toolBtn, { backgroundColor: isDark ? colors.surface : '#FDF2F8', borderColor: isDark ? colors.secondary : '#F3F4F6' }]} onPress={() => setReportModalVisible(true)}>
                        <Text style={styles.toolIcon}>📝</Text>
                        <Text style={[styles.toolText, { color: colors.text }]}>Write Journal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.toolBtn, { backgroundColor: isDark ? colors.surface : '#FFF7ED', borderColor: isDark ? colors.warning : '#F3F4F6' }]} onPress={() => setExpenseModalVisible(true)}>
                        <Text style={styles.toolIcon}>💸</Text>
                        <Text style={[styles.toolText, { color: colors.text }]}>Add Expense</Text>
                    </TouchableOpacity>
                </View>

                {/* Manual Reports Section */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Business Journals</Text>
                {manualReports.length > 0 ? manualReports.map(report => (
                    <Card key={report.id} style={styles.reportCard}>
                        <View style={styles.reportHeader}>
                            <Text style={[styles.reportTitle, { color: colors.text }]}>{report.title}</Text>
                            <TouchableOpacity onPress={() => deleteManualReport(report.id)}>
                                <Text style={styles.deleteLink}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.reportDate, { color: colors.textMuted }]}>{new Date(report.date).toLocaleDateString()}</Text>
                        <Text style={[styles.reportContent, { color: colors.textSecondary }]}>{report.content}</Text>
                    </Card>
                )) : (
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>No journals written yet.</Text>
                )}

                {/* Money History Section */}
                <Text style={[styles.sectionTitle, { marginTop: 32, color: colors.text }]}>Cash Received History</Text>
                {payments.length > 0 ? payments.slice(0, 10).map(p => (
                    <Card key={p.id} style={styles.paymentCard}>
                        <View style={styles.paymentInfo}>
                            <Text style={styles.paymentValue}>+ SSP {p.amount.toLocaleString()}</Text>
                            <Text style={[styles.paymentNotes, { color: colors.textSecondary }]}>{p.notes}</Text>
                        </View>
                        <Text style={[styles.paymentDate, { color: colors.textMuted }]}>{new Date(p.date).toLocaleDateString()}</Text>
                    </Card>
                )) : (
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>No cash records found.</Text>
                )}

                {/* Expenses History Section */}
                <Text style={[styles.sectionTitle, { marginTop: 32, color: colors.text }]}>Personal Expense History</Text>
                {expenses.length > 0 ? expenses.map(e => (
                    <Card key={e.id} style={[styles.paymentCard, { borderColor: isDark ? colors.error : '#FEE2E2', borderWidth: 1 }]}>
                        <View style={styles.paymentInfo}>
                            <Text style={[styles.paymentValue, { color: colors.error }]}>- SSP {e.amount.toLocaleString()}</Text>
                            <Text style={[styles.paymentNotes, { color: colors.textSecondary }]}>{e.description}</Text>
                        </View>
                        <TouchableOpacity onPress={() => deleteExpense(e.id)}>
                            <Text style={[styles.deleteLink, { marginTop: 0 }]}>Remove</Text>
                        </TouchableOpacity>
                    </Card>
                )) : (
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>No personal expenses recorded.</Text>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Money Modal */}
            <Modal visible={paymentModalVisible} animationType="slide" presentationStyle="pageSheet">
                <FormLayout contentContainerStyle={[styles.modalContainer, { backgroundColor: colors.surface }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Record Cash</Text>
                        <AppButton title="✕" type="ghost" onPress={() => setPaymentModalVisible(false)} />
                    </View>
                    <Text style={[styles.label, { color: colors.textMuted }]}>AMOUNT RECEIVED (SSP)</Text>
                    <TextInput style={[styles.input, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border, color: colors.text }]} placeholder="0.00" placeholderTextColor={colors.textMuted} value={amount} onChangeText={setAmount} keyboardType="numeric" />
                    <Text style={[styles.label, { color: colors.textMuted }]}>NOTES</Text>
                    <TextInput style={[styles.input, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border, color: colors.text, height: 100 }]} placeholder="Source of money..." placeholderTextColor={colors.textMuted} value={notes} onChangeText={setNotes} multiline />
                    <AppButton title="Save Record" onPress={handleSavePayment} style={{ marginTop: 20 }} />
                </FormLayout>
            </Modal>

            {/* Journal Modal */}
            <Modal visible={reportModalVisible} animationType="slide" presentationStyle="pageSheet">
                <FormLayout contentContainerStyle={[styles.modalContainer, { backgroundColor: colors.surface }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>New Journal Entry</Text>
                        <AppButton title="✕" type="ghost" onPress={() => setReportModalVisible(false)} />
                    </View>
                    <Text style={[styles.label, { color: colors.textMuted }]}>REPORT TITLE</Text>
                    <TextInput style={[styles.input, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border, color: colors.text }]} placeholder="e.g. Daily Closing" placeholderTextColor={colors.textMuted} value={reportTitle} onChangeText={setReportTitle} />
                    <Text style={[styles.label, { color: colors.textMuted }]}>REPORT CONTENT</Text>
                    <TextInput style={[styles.input, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border, color: colors.text, height: 200 }]} placeholder="Describe the business day..." placeholderTextColor={colors.textMuted} value={reportContent} onChangeText={setReportContent} multiline />
                    <AppButton title="Submit Journal" onPress={handleSaveReport} style={{ marginTop: 20 }} />
                </FormLayout>
            </Modal>

            {/* Expense Modal */}
            <Modal visible={expenseModalVisible} animationType="slide" presentationStyle="pageSheet">
                <FormLayout contentContainerStyle={[styles.modalContainer, { backgroundColor: colors.surface }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Record Expense</Text>
                        <AppButton title="✕" type="ghost" onPress={() => setExpenseModalVisible(false)} />
                    </View>
                    <Text style={[styles.label, { color: colors.textMuted }]}>AMOUNT SPENT (SSP)</Text>
                    <TextInput style={[styles.input, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border, color: colors.text }]} placeholder="0.00" placeholderTextColor={colors.textMuted} value={expenseAmount} onChangeText={setExpenseAmount} keyboardType="numeric" />
                    <Text style={[styles.label, { color: colors.textMuted }]}>DESCRIPTION</Text>
                    <TextInput style={[styles.input, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border, color: colors.text }]} placeholder="What was this for? (e.g. Lunch, Transports)" placeholderTextColor={colors.textMuted} value={expenseDescription} onChangeText={setExpenseDescription} />
                    <AppButton title="Save Expense" onPress={handleSaveExpense} style={{ marginTop: 20 }} />
                </FormLayout>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 24 },
    header: { marginBottom: 32, marginTop: 10, flexDirection: 'row', alignItems: 'center' },
    headerAccent: { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
    title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    
    pdfBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
    pdfBtnText: { fontSize: 11, fontWeight: '900' },

    mainCard: { padding: 24, borderRadius: 20 },
    cardLabel: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 1 },
    profitText: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', marginBottom: 16 },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 16 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    stat: { flex: 1 },
    statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 4, fontWeight: 'bold' },
    statValue: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
    
    sectionTitle: { fontSize: 15, fontWeight: '900', marginTop: 32, marginBottom: 16 },
    
    toolRow: { flexDirection: 'row', gap: 16 },
    toolBtn: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1 },
    toolIcon: { fontSize: 24, marginBottom: 8 },
    toolText: { fontSize: 11, fontWeight: '900' },

    reportCard: { padding: 20, borderRadius: 16, marginBottom: 12 },
    reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    reportTitle: { fontSize: 16, fontWeight: 'bold' },
    reportDate: { fontSize: 11, marginTop: 2, marginBottom: 10 },
    reportContent: { fontSize: 13, lineHeight: 18 },
    deleteLink: { fontSize: 11, color: '#EF4444', fontWeight: 'bold' },

    paymentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12 },
    paymentInfo: { flex: 1 },
    paymentValue: { fontSize: 15, fontWeight: 'bold', color: '#10B981' },
    paymentNotes: { fontSize: 12, marginTop: 2 },
    paymentDate: { fontSize: 11 },

    emptyText: { textAlign: 'center', marginTop: 20, fontStyle: 'italic', fontSize: 13 },
    modalContainer: { padding: 24, paddingTop: 60 },
    modalTitle: { fontSize: 22, fontWeight: '900' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
    label: { fontSize: 11, fontWeight: '900', marginBottom: 12, letterSpacing: 1 },
    input: { padding: 16, borderRadius: 12, borderWidth: 1, fontSize: 16, marginBottom: 20 }
});
