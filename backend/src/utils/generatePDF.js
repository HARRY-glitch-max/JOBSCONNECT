// backend/src/utils/generatePDF.js
import PDFDocument from 'pdfkit';

export const generateHiringReportPDF = (reportData, employerName) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header with Logo and Title
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .fillColor('#2563eb')
         .text('JOBCONNECT', { align: 'center' })
         .moveDown(0.5);
      
      doc.fontSize(16)
         .fillColor('#1e293b')
         .text('Hiring Report', { align: 'center' })
         .moveDown(0.5);
      
      doc.fontSize(10)
         .fillColor('#64748b')
         .text(`Generated for: ${employerName}`, { align: 'center' })
         .text(`Date: ${new Date().toLocaleString()}`, { align: 'center' })
         .moveDown(1);

      // Add a horizontal line
      doc.strokeColor('#cbd5e1')
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke()
         .moveDown(1);

      // Jobs Section
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#1e293b')
         .text('📊 Job Postings Summary', { underline: true })
         .moveDown(0.5);
      
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#334155');
      
      // Jobs Table
      const jobsTable = {
        headers: ['Metric', 'Count'],
        rows: [
          ['Total Jobs Posted', reportData.jobs.total.toString()],
          ['Active Jobs', reportData.jobs.active.toString()],
          ['Closed Jobs', reportData.jobs.closed.toString()]
        ]
      };
      
      drawTable(doc, jobsTable, 50, doc.y);
      doc.moveDown(1);

      // Applications Section
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#1e293b')
         .text('📝 Applications Overview', { underline: true })
         .moveDown(0.5);
      
      const applicationsTable = {
        headers: ['Status', 'Count'],
        rows: [
          ['Total Applications', reportData.applications.total.toString()],
          ['Pending Review', reportData.applications.pending.toString()],
          ['Shortlisted', reportData.applications.shortlisted.toString()],
          ['Hired', reportData.applications.hired.toString()],
          ['Rejected', reportData.applications.rejected.toString()]
        ]
      };
      
      drawTable(doc, applicationsTable, 50, doc.y);
      doc.moveDown(1);

      // Interviews Section
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#1e293b')
         .text('🎯 Interview Statistics', { underline: true })
         .moveDown(0.5);
      
      const interviewsTable = {
        headers: ['Status', 'Count'],
        rows: [
          ['Total Interviews', reportData.interviews.total.toString()],
          ['Scheduled', reportData.interviews.scheduled.toString()],
          ['Completed', reportData.interviews.completed.toString()],
          ['Cancelled', reportData.interviews.cancelled.toString()]
        ]
      };
      
      drawTable(doc, interviewsTable, 50, doc.y);
      doc.moveDown(1);

      // Check if we need a new page for metrics
      if (doc.y > 650) {
        doc.addPage();
      }

      // Key Metrics Section
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#1e293b')
         .text('📈 Key Performance Metrics', { underline: true })
         .moveDown(0.5);
      
      // Calculate additional metrics
      const totalApplications = reportData.applications.total;
      const totalJobs = reportData.jobs.total;
      const avgApplicationsPerJob = totalJobs > 0 ? (totalApplications / totalJobs).toFixed(1) : 0;
      const hireRate = totalApplications > 0 
        ? ((reportData.applications.hired / totalApplications) * 100).toFixed(1) 
        : 0;
      
      const metricsData = [
        { metric: 'Average Applications per Job', value: avgApplicationsPerJob },
        { metric: 'Overall Hire Rate', value: `${hireRate}%` },
        { metric: 'Interview Success Rate', value: reportData.interviews.total > 0 
          ? `${((reportData.interviews.completed / reportData.interviews.total) * 100).toFixed(1)}%` 
          : '0%' },
        { metric: 'Active vs Closed Jobs', value: `${reportData.jobs.active} / ${reportData.jobs.closed}` }
      ];
      
      let yPos = doc.y;
      metricsData.forEach(metric => {
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor('#475569')
           .text(`${metric.metric}:`, 50, yPos);
        doc.font('Helvetica')
           .fillColor('#2563eb')
           .text(` ${metric.value}`, 200, yPos);
        yPos += 25;
      });
      
      doc.moveDown(2);

      // Recommendations Section
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#1e293b')
         .text('💡 Recommendations', { underline: true })
         .moveDown(0.5);
      
      const recommendations = [];
      
      if (reportData.applications.pending > 20) {
        recommendations.push('• High number of pending applications - consider faster screening process');
      }
      if (reportData.jobs.active > 10 && reportData.applications.total / reportData.jobs.active < 5) {
        recommendations.push('• Low applications per active job - review job descriptions or increase promotion');
      }
      if (reportData.interviews.scheduled > 10 && reportData.interviews.completed / reportData.interviews.scheduled < 0.5) {
        recommendations.push('• Low interview completion rate - improve scheduling communication');
      }
      if (recommendations.length === 0) {
        recommendations.push('• Your hiring metrics are looking good! Keep up the great work!');
      }
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#475569');
      
      recommendations.forEach(rec => {
        doc.text(rec, 50, doc.y + 5);
        doc.moveDown(0.5);
      });
      
      // Add simple footer on the last page only (no switchToPage loop)
      doc.fontSize(8)
         .fillColor('#94a3b8')
         .text(
           `Generated by JOBCONNECT • ${new Date().toLocaleDateString()}`,
           50,
           doc.page.height - 50,
           { align: 'center' }
         );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Helper function to draw tables
function drawTable(doc, table, startX, startY) {
  const cellPadding = 5;
  const colWidth = 200;
  const rowHeight = 25;
  
  let y = startY;
  
  // Check if we need a new page for the table
  const estimatedTableHeight = (table.rows.length + 1) * rowHeight + 20;
  if (y + estimatedTableHeight > doc.page.height - 100) {
    doc.addPage();
    y = 50;
  }
  
  // Draw headers
  doc.font('Helvetica-Bold')
     .fillColor('#ffffff');
  
  doc.rect(startX, y, colWidth, rowHeight)
     .fill('#2563eb');
  doc.rect(startX + colWidth, y, colWidth, rowHeight)
     .fill('#2563eb');
  
  doc.fillColor('#ffffff')
     .text(table.headers[0], startX + cellPadding, y + 8)
     .text(table.headers[1], startX + colWidth + cellPadding, y + 8);
  
  y += rowHeight;
  
  // Draw rows
  doc.font('Helvetica')
     .fillColor('#1e293b');
  
  let isEven = false;
  for (const row of table.rows) {
    // Check if we need a new page for remaining rows
    if (y + rowHeight > doc.page.height - 80) {
      doc.addPage();
      y = 50;
      
      // Redraw headers on new page
      doc.font('Helvetica-Bold')
         .fillColor('#ffffff');
      doc.rect(startX, y, colWidth, rowHeight)
         .fill('#2563eb');
      doc.rect(startX + colWidth, y, colWidth, rowHeight)
         .fill('#2563eb');
      doc.fillColor('#ffffff')
         .text(table.headers[0], startX + cellPadding, y + 8)
         .text(table.headers[1], startX + colWidth + cellPadding, y + 8);
      y += rowHeight;
      doc.font('Helvetica')
         .fillColor('#1e293b');
      isEven = false;
    }
    
    const fillColor = isEven ? '#f8fafc' : '#ffffff';
    
    doc.rect(startX, y, colWidth, rowHeight)
       .fill(fillColor);
    doc.rect(startX + colWidth, y, colWidth, rowHeight)
       .fill(fillColor);
    
    doc.fillColor('#1e293b')
       .text(row[0], startX + cellPadding, y + 8)
       .text(row[1], startX + colWidth + cellPadding, y + 8);
    
    y += rowHeight;
    isEven = !isEven;
  }
  
  // Reset y position
  doc.y = y + 10;
  return doc.y;
}