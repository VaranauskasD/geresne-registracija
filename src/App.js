import axios from 'axios';
import classNames from 'classnames';
import {
  format,
  addMonths,
  addMinutes,
  addSeconds,
  differenceInMilliseconds,
} from 'date-fns';
import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Spinner } from '@material-tailwind/react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

import './App.css';

const App = () => {
  const searchFrequencyInMinutes = 5;
  const [specialists, setSpecialists] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [filteredSpecialists, setFilteredSpecialists] = useState(null);
  const [selectedSpecialist, setSelectedSpecialist] = useState(null);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchActive, setSearchActive] = useState(false);
  const [timedSearchActive, setTimedSearchActive] = useState(false);
  const lithuanianToEnglishMap = {
    Ą: 'A',
    Č: 'C',
    Ę: 'E',
    Ė: 'E',
    Į: 'I',
    Š: 'S',
    Ų: 'U',
    Ū: 'U',
    Ž: 'Z',
  };
  const searchRef = useRef(null);
  const filteredResults = useRef(null);

  useEffect(() => {
    axios
      .get('https://ipr.esveikata.lt/api/searchesNew/specialists')
      .then(({ data }) => setSpecialists(data.data));
    axios
      .get('https://ipr.esveikata.lt/api/searchesNew/institutions')
      .then(({ data }) => setInstitutions(data.data));
  }, []);

  useEffect(() => {
    handleSpecialistSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, specialists]);

  useEffect(() => {
    if (selectedSpecialist) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSpecialist]);

  const handleSpecialistSearch = () => {
    setFilteredSpecialists(
      specialists?.filter(
        (specialist) =>
          search.length > 0 &&
          specialist?.fullName
            ?.toUpperCase()
            ?.replace(
              /[ĄČĘĖĮŠŲŪŽ]/g,
              (match) => lithuanianToEnglishMap[match] || match
            )
            ?.includes(
              search
                ?.toUpperCase()
                ?.replace(
                  /[ĄČĘĖĮŠŲŪŽ]/g,
                  (match) => lithuanianToEnglishMap[match] || match
                )
            )
      )
    );
  };

  const handleClick = async (event, id) => {
    setSelectedSpecialist(
      filteredSpecialists
        ?.filter((specialist) => specialist.fullName === event.target.value)
        .pop()
    );
  };

  const getTimeBounds = () => {
    const currentLithuaniaDate = new Date(
      new Date(Date.now()).toLocaleString('en-US', {
        timeZone: 'Europe/Vilnius',
      })
    );
    const currentLithuaniaTime = currentLithuaniaDate.getTime();
    const futureLithuaniaDate = addMonths(currentLithuaniaDate, 6);
    const futureLithuaniaTime = futureLithuaniaDate.getTime();

    return { leftBound: currentLithuaniaTime, rightBound: futureLithuaniaTime };
  };

  const getMunicipality = () => {
    const { istgId: institutionId } = selectedSpecialist?.institution.istgId;
    const selectedInstitution = institutions?.filter(
      (institution) => institution?.istgId === institutionId
    );
    return selectedInstitution?.municipalityId;
  };

  const clearIntervals = async () => {
    setTimeout(() => {
      for (var i = setTimeout(function () {}, 0); i > 0; i--) {
        clearInterval(i);
        clearTimeout(i);
        if (cancelAnimationFrame) cancelAnimationFrame(i);
      }
    }, 3000);
  };

  const handleTimedSearch = async () => {
    if (timedSearchActive) {
      setTimedSearchActive(false);
      clearIntervals();
    } else {
      setTimedSearchActive(true);
      const searchFrequencyInMilliseconds =
        searchFrequencyInMinutes * 60 * 1000;

      setInterval(() => handleSearch(), searchFrequencyInMilliseconds);
    }
  };

  const handleSearch = (event) => {
    setSearchActive(true);

    const municipality = getMunicipality();
    const { leftBound, rightBound } = getTimeBounds();

    axios
      .get('https://ipr.esveikata.lt/api/searches/appointments/times', {
        params: {
          municipalityId: municipality,
          specialistId: selectedSpecialist.id,
          organizationId: selectedSpecialist.organizationId,
          leftBound: leftBound,
          rightBound: rightBound,
          page: 0,
          size: 50,
        },
      })
      .then((data) => setSearchResults(data.data.data))
      .finally(() => setSearchActive(false));
  };

  const Timer = () => {
    const [time, setTime] = useState(Date.now());
    const [timeStamp, setTimeStamp] = useState(
      searchFrequencyInMinutes > 1
        ? addMinutes(Date.now(), searchFrequencyInMinutes)
        : addSeconds(Date.now(), searchFrequencyInMinutes)
    );

    useEffect(() => {
      setInterval(() => {
        setTime(Date.now());
        if (timeStamp < Date.now()) {
          setTimeStamp(
            searchFrequencyInMinutes > 1
              ? addMinutes(Date.now(), searchFrequencyInMinutes)
              : addSeconds(Date.now(), searchFrequencyInMinutes)
          );
        }
      }, 1000);
    }, []);

    return (
      <>{format(differenceInMilliseconds(timeStamp, Date.now()), 'mm:ss')}</>
    );
  };

  return (
    <div className=''>
      <header className='bg-yellow-800 text-white font-bold h-12 flex items-center p-4 drop-shadow-md'>
        <h1 className=''>Registracija pas gydytoją</h1>
      </header>
      <div className='mt-40 m-4 flex flex-col justify-between min-h-screen'>
        <div>
          <h1 className='text-xl font-bold text-center m-4'>
            Gydytojo paieška
          </h1>
          <div className='w-full flex justify-center'>
            <div className='m-auto flex w-[40rem] md:w-[60rem] gap-6 flex-col'>
              <div className='w-full flex items-center flex-col md:flex-row gap-1 md:gap-2'>
                <div className='relative flex w-full items-center h-16 md:h-10'>
                  <Input
                    inputRef={searchRef}
                    size='md'
                    label='Vardas'
                    color='indigo'
                    onChange={({ target }) => setSearch(target.value)}
                  />
                </div>
                <Button
                  disabled={!selectedSpecialist}
                  variant={timedSearchActive ? 'outlined' : 'filled'}
                  color='orange'
                  className='w-full md:w-auto flex justify-between min-w-[13rem] items-center gap-3 h-10 md:h-10 p-2'
                  onClick={(event) => {
                    handleTimedSearch(event);
                  }}
                >
                  <span className='text-left'>
                    {timedSearchActive ? (
                      <>
                        Stabdyti paiešką <Timer />
                      </>
                    ) : (
                      `Tikrinti kas ${searchFrequencyInMinutes} minutes`
                    )}
                  </span>
                  <ArrowPathIcon strokeWidth={4} className='h-6 w-6' />
                </Button>
              </div>
              <div
                name='gydytojas'
                id='gydytojas'
                ref={filteredResults}
                className='flex flex-col max-h-[24rem] gap-y-0.5 overflow-scroll'
              >
                {filteredSpecialists?.map((specialist, key) => (
                  <label
                    key={`specialist-${specialist.id}-${key}`}
                    htmlFor={`specialist-${specialist.id}-${key}`}
                    className={classNames(
                      'text-left border-2 rounded-md flex items-center p-2 cursor-pointer',
                      {
                        'bg-orange-100':
                          specialist?.fullName === selectedSpecialist?.fullName,
                      }
                    )}
                  >
                    <input
                      id={`specialist-${specialist.id}-${key}`}
                      selected={
                        specialist?.fullName === selectedSpecialist?.fullName
                      }
                      value={specialist?.fullName}
                      type='radio'
                      className='fixed opacity-0 pointer-events-none'
                      onClick={(event) => handleClick(event, specialist.id)}
                    />
                    {specialist.fullName}
                  </label>
                ))}
              </div>
              {selectedSpecialist && (
                <>
                  <h2>
                    {selectedSpecialist?.fullName
                      ?.match('/^([^(]+)/')
                      ?.matches[1]?.trim()
                      ?.split(/\s+/)
                      ?.join('')}
                  </h2>
                  {searchActive ? (
                    <div className='w-full flex justify-center'>
                      <Spinner />
                    </div>
                  ) : (
                    <table>
                      <thead>
                        <tr className='text-left'>
                          <th>Paslauga</th>
                          <th>Įstaiga</th>
                          <th>Laikas</th>
                          <th>Nuoroda</th>
                        </tr>
                      </thead>
                      <tbody className=''>
                        {(searchResults?.length > 0 &&
                          searchResults?.map((result) => {
                            return (
                              <tr>
                                <td className='text-left'>
                                  {result.healthcareServiceName ||
                                    'Nerastas paslaugos pavadinimas'}
                                </td>
                                <td className='text-left'>
                                  {result.organizationName ||
                                    'Nerastas įstaigos pavadinimas'}
                                </td>
                                <td className='text-left'>
                                  {format(
                                    new Date(
                                      new Date(
                                        result.earliestTime
                                      ).toLocaleString('en-US', {
                                        timeZone: 'Europe/Vilnius',
                                      })
                                    ),
                                    'yyyy-MM-dd HH:mm'
                                  ) || 'Nerastas anksčiausias laikas'}
                                </td>
                                <td className='text-left py-4'>
                                  <a
                                    target='_blank'
                                    rel='noreferrer'
                                    className='p-2 border-2 solid border-orange-600 rounded-md'
                                    href={`https://ipr.esveikata.lt/available-registrations?organizationId=${result.organizationId}&serviceId=${result.healthcareServiceId}&practitionerId=${selectedSpecialist.id}&leftBound=${result.earliestTime}`}
                                  >
                                    Registruotis
                                  </a>
                                </td>
                              </tr>
                            );
                          })) || (
                          <tr className='p-8'>
                            <td>Nerasta rezultatų</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div className='flex w-full justify-center items-center m-auto'>
          <a
            target='_blank'
            rel='noreferrer'
            href='https://suukraina.lt/'
            className='flex flex-col w-full mb-12 rounded border-2 solid border-slate-600 drop-shadow-sm'
          >
            <span className='text-center font-bold text-md bg-light-blue-600 text-white'>
              Paremti
            </span>
            <span className='text-center font-bold text-md bg-yellow-600 text-white'>
              Ukrainą
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default App;
