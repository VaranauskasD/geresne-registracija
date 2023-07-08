import axios from 'axios';
import { format, addMonths } from 'date-fns';
import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Spinner } from '@material-tailwind/react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

import './App.css';

const App = () => {
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, specialists]);

  useEffect(() => {
    axios
      .get('https://ipr.esveikata.lt/api/searchesNew/specialists')
      .then(({ data }) => setSpecialists(data.data));
    axios
      .get('https://ipr.esveikata.lt/api/searchesNew/institutions')
      .then(({ data }) => setInstitutions(data.data));
  }, []);

  useEffect(() => {
    console.log(selectedSpecialist);
  }, [selectedSpecialist]);

  const handleClick = (event, id) => {
    setSearch(event.target.innerText);
    setSelectedSpecialist(
      filteredSpecialists?.filter((specialist) => specialist.id === id).pop()
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

    console.log();
    return { leftBound: currentLithuaniaTime, rightBound: futureLithuaniaTime };
  };

  const getMunicipality = () => {
    const { istgId: institutionId } = selectedSpecialist?.institution.istgId;
    const selectedInstitution = institutions?.filter(
      (institution) => institution?.istgId === institutionId
    );
    return selectedInstitution?.municipalityId;
  };

  const handleTimedSearch = async () => {
    window.setInterval(() => handleSearch(), 1000);
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

  return (
    <div className=''>
      <header className='bg-yellow-800 text-white font-bold h-12 flex items-center p-4 drop-shadow-md'>
        <h1 className=''>Registracija pas gydytoją</h1>
      </header>
      <div className='mt-40 m-4'>
        <h1 className='text-xl font-bold text-center m-4'>Gydytojo paieška</h1>
        <div className='w-full m-auto flex justify-center'>
          <div className='flex flex-col w-[40rem] md:w-[60rem] gap-6'>
            <div className='w-full flex items-center flex-col md:flex-row gap-1 md:gap-2'>
              <div className='relative flex w-full items-center h-16 md:h-10'>
                <Input
                  inputRef={searchRef}
                  size='md'
                  label='Vardas'
                  color='indigo'
                  onChange={({ target }) => setSearch(target.value)}
                />
                <Button
                  size='sm'
                  color={search ? 'indigo' : 'blue-gray'}
                  disabled={!search}
                  className='!absolute right-1 top-4 md:top-1 rounded'
                  onClick={(event) => handleSearch(event)}
                >
                  Ieškoti
                </Button>
              </div>
              <Button
                // disabled={!selectedSpecialist}
                disabled={true}
                variant='filled'
                color='orange'
                className='w-full md:w-auto flex justify-between min-w-[13rem] items-center gap-3 h-10 md:h-10 p-2'
                onClick={(event) => {
                  if (!timedSearchActive) {
                    setTimedSearchActive(true);
                    handleTimedSearch(event);
                  }
                }}
              >
                <span className='text-left'>Tikrinti kas 5 minutes</span>
                <ArrowPathIcon strokeWidth={4} className='h-6 w-6' />
              </Button>
            </div>
            <div
              ref={filteredResults}
              className='flex flex-col max-h-[24rem] gap-y-0.5 overflow-scroll'
            >
              {filteredSpecialists?.map((specialist, key) => (
                <button
                  id={specialist.id}
                  key={`specialist-${specialist.id}-${key}`}
                  type='button'
                  className='text-left border-2 rounded-md min-h-[52px] p-2'
                  onClick={(event) => handleClick(event, specialist.id)}
                >
                  {specialist.fullName}
                </button>
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
                      </tr>
                    </thead>
                    <tbody className=''>
                      {(searchResults?.length > 0 &&
                        searchResults?.map((result) => {
                          console.log(selectedSpecialist);
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
                              <td className='text-left'>
                                <a
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
    </div>
  );
};

export default App;
