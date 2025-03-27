import React, { useEffect } from 'react';
import styles from './about.scss';
import { useModules } from '../hooks/useModules';
import { formatDate, formatDatetime, showNotification } from '@openmrs/esm-framework';
import FrontendModule from '../frontend-modules/frontend-modules.component';
const packageInfo = require('../release-version.js');

interface AboutProps {}

const About: React.FC<AboutProps> = () => {
  const { modules, isLoading } = useModules();
  const kenyaEMR = modules.find(({ uuid }) => uuid === 'kenyaemr');
  const { title, container, aboutBody, aboutPage } = styles;
  const { VERSION } = packageInfo;

  return (
    <div className={styles.main}>
      <div className={aboutPage}>
        <div className={container}>
          <div className={title}>
            <div>
              <h3>ZimHospitalCare</h3>
            </div>
            <img src="zim_logo.png" alt="court_of_arms" width="50" height="50" />
          </div>
          <div className={aboutBody}>
            <p>ZimHospitalCare Version</p>
            <p>{`v${kenyaEMR?.version}`}</p>
            <p>SPA Version</p>
            <p>{`v${VERSION.version}`}</p>
            <p>Build date time</p>
            <p>{formatDatetime(new Date(VERSION.buildDate), { mode: 'standard' })}</p>
          </div>
        </div>
      </div>
      <FrontendModule />
    </div>
  );
};

export default About;
