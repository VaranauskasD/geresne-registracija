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

  useEffect(() => {
    axios
      .get('https://ipr.esveikata.lt/api/searchesNew/specialists')
      .then(({ data }) => {
        const returnedSpecialists = data.data;
        const chunkSize = 500;
        const chunkedSpecialists = [];
        for (let i = 0; i < returnedSpecialists.length; i += chunkSize) {
          const specialistsChunk = returnedSpecialists.slice(i, i + chunkSize);
          chunkedSpecialists.push(specialistsChunk);
        }
        setSpecialists(chunkedSpecialists);
      });
    axios
      .get('https://ipr.esveikata.lt/api/searchesNew/institutions')
      .then(({ data }) => setInstitutions(data.data));
  }, []);

  useEffect(() => {
    if (search?.length > 2) {
      handleSpecialistSearch();
    } else {
      setFilteredSpecialists(null);
    }
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
      specialists
        ?.map((specialistsChunk) =>
          specialistsChunk?.filter(
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
        )
        ?.flat()
    );
  };

  const handleClick = async (event, id) => {
    window.scrollTo({ top: 0, left: 0 });
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
        <h1>Registracija pas gydytoją</h1>
      </header>
      <div className='mt-4 md:mt-24 m-4 flex flex-col min-h-[70vh]'>
        <div>
          <h1 className='text-xl font-bold text-center m-4'>
            Gydytojo paieška
          </h1>
          <div className='w-full flex justify-center'>
            <div className='m-auto flex w-[40rem] md:w-[60rem] gap-6 flex-col drop-shadow-sm'>
              <div className='w-full flex items-center flex-col md:flex-row gap-1 md:gap-2'>
                <div className='relative flex w-full items-center h-16 md:h-10'>
                  <Input
                    size='md'
                    aria-label='Iveskite gydytojo vardą'
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
              <ul
                aria-label={'Gydytojai'}
                name='gydytojas'
                id='gydytojas'
                className='flex flex-col max-h-[24rem] overflow-y-scroll gap-y-0.5 '
              >
                {filteredSpecialists?.map((specialist, key) => (
                  <li key={`specialist-${specialist.id}-${key}`}>
                    <label
                      htmlFor={`specialist-${specialist.id}-${key}`}
                      className={classNames(
                        'text-left border-b-2 rounded-md flex items-center p-2 cursor-pointer hover:bg-orange-50 hover:bg-opacity-50',
                        {
                          'bg-orange-100 hover:bg-orange-100 hover:bg-opacity-100':
                            specialist?.fullName ===
                            selectedSpecialist?.fullName,
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
                  </li>
                ))}
              </ul>
              {selectedSpecialist && (
                <div className='pt-6'>
                  <h2 className='font-bold mb-2'>
                    {
                      selectedSpecialist?.fullName
                      // ?.match('/^([^(]+)/')
                      // ?.matches[1]?.trim()
                      // ?.split(/\s+/)
                      // ?.join('')}
                    }
                  </h2>
                  {searchActive ? (
                    <div className='w-full flex justify-center'>
                      <Spinner />
                    </div>
                  ) : (
                    <table className='drop-shadow-sm'>
                      <thead>
                        <tr className='text-left'>
                          <th>Paslauga</th>
                          <th>Įstaiga</th>
                          <th>Laikas</th>
                          <th>Nuoroda</th>
                        </tr>
                      </thead>
                      <tbody className='border-t-[16px] border-transparent max-h-[260px] overflow-scroll'>
                        {(searchResults?.length > 0 &&
                          searchResults?.map((result) => {
                            return (
                              <tr
                                key={`${result?.healthcareServiceName}-${result?.organizationName}`}
                                className='text-left border-b-2 p-2 cursor-pointer'
                              >
                                <td className='text-left'>
                                  {result?.healthcareServiceName ||
                                    'Nerastas paslaugos pavadinimas'}
                                </td>
                                <td className='text-left'>
                                  {result?.organizationName ||
                                    'Nerastas įstaigos pavadinimas'}
                                </td>
                                <td className='text-left'>
                                  {format(
                                    new Date(
                                      new Date(
                                        result?.earliestTime
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
                          <>
                            <tr>
                              <td colSpan={4}>Nerasta rezultatų.</td>
                            </tr>
                            <tr>
                              <td colSpan={4}>
                                Naudokite automatinę paiešką norėdami gauti
                                rezultatus, kai atsiras talonėlių.
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* <div className='flex w-full justify-center items-end'>
          <a
            target='_blank'
            rel='noreferrer'
            href='https://suukraina.lt/'
            className='flex flex-col w-full md:w-[16rem] rounded border-2 solid border-slate-600 drop-shadow-sm'
          >
            <span className='text-center font-bold text-md bg-light-blue-600 text-white p-2'>
              Paremti
            </span>
            <span className='text-center font-bold text-md bg-yellow-600 text-white p-2'>
              Ukrainą
            </span>
          </a>
        </div> */}
      </div>
    </div>
  );
};

export default App;
